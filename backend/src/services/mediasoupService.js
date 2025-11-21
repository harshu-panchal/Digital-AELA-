import mediasoup from "mediasoup";

/**
 * mediasoup Service
 * Manages mediasoup workers, routers, and transports for voice rooms
 */

let workers = [];
let nextWorkerIndex = 0;
let mediasoupAvailable = false;

// mediasoup configuration
const mediasoupConfig = {
  // Number of mediasoup workers to spawn
  numWorkers: process.env.MEDIASOUP_NUM_WORKERS
    ? parseInt(process.env.MEDIASOUP_NUM_WORKERS, 10)
    : 2,
  // Worker settings
  workerSettings: {
    logLevel: process.env.MEDIASOUP_LOG_LEVEL || "warn",
    logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"],
    rtcMinPort: process.env.MEDIASOUP_RTC_MIN_PORT
      ? parseInt(process.env.MEDIASOUP_RTC_MIN_PORT, 10)
      : 40000,
    rtcMaxPort: process.env.MEDIASOUP_RTC_MAX_PORT
      ? parseInt(process.env.MEDIASOUP_RTC_MAX_PORT, 10)
      : 49999,
  },
  // Router settings
  routerOptions: {
    mediaCodecs: [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
      },
    ],
  },
};

// Store routers per room: Map<roomId, Router>
const routers = new Map();

// Store transports per socket: Map<socketId, { sendTransport, recvTransport, producer, consumers }>
const transports = new Map();

/**
 * Initialize mediasoup workers
 */
export async function initializeWorkers() {
  try {
    // eslint-disable-next-line no-console
    console.log(`[mediasoup] Creating ${mediasoupConfig.numWorkers} workers...`);

    for (let i = 0; i < mediasoupConfig.numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        ...mediasoupConfig.workerSettings,
      });

      worker.on("died", () => {
        // eslint-disable-next-line no-console
        console.error(
          "[mediasoup] Worker died, exiting in 2 seconds... [pid:%d]",
          worker.pid
        );
        setTimeout(() => process.exit(1), 2000);
      });

      workers.push(worker);
      // eslint-disable-next-line no-console
      console.log(`[mediasoup] Worker created [pid:${worker.pid}]`);
    }

    // eslint-disable-next-line no-console
    console.log(`[mediasoup] ${workers.length} workers created`);
    mediasoupAvailable = true;
    return workers;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[mediasoup] Error creating workers:", error);
    mediasoupAvailable = false;
    // Don't throw - allow server to start without mediasoup
    return [];
  }
}

/**
 * Check if mediasoup is available
 */
export function isMediasoupAvailable() {
  return mediasoupAvailable && workers.length > 0;
}

/**
 * Get next available worker (round-robin)
 */
function getNextWorker() {
  if (!mediasoupAvailable || workers.length === 0) {
    throw new Error("mediasoup workers are not available");
  }
  const worker = workers[nextWorkerIndex];
  nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
  return worker;
}

/**
 * Get or create router for a room
 */
export async function getOrCreateRouter(roomId) {
  if (!mediasoupAvailable || workers.length === 0) {
    throw new Error("mediasoup is not available. Voice features are disabled.");
  }

  if (routers.has(roomId)) {
    return routers.get(roomId);
  }

  const worker = getNextWorker();
  const router = await worker.createRouter(mediasoupConfig.routerOptions);

  routers.set(roomId, router);
  // eslint-disable-next-line no-console
  console.log(`[mediasoup] Router created for room ${roomId}`);

  return router;
}

/**
 * Get router for a room
 */
export function getRouter(roomId) {
  return routers.get(roomId);
}

/**
 * Delete router for a room
 */
export async function deleteRouter(roomId) {
  const router = routers.get(roomId);
  if (router) {
    router.close();
    routers.delete(roomId);
    // eslint-disable-next-line no-console
    console.log(`[mediasoup] Router deleted for room ${roomId}`);
  }
}

/**
 * Create WebRTC transport
 */
export async function createTransport(roomId, socketId, direction) {
  const router = await getOrCreateRouter(roomId);

  // TURN server configuration
  const turnServers = [];
  if (process.env.TURN_SERVER_URL && process.env.TURN_SERVER_USERNAME && process.env.TURN_SERVER_CREDENTIAL) {
    turnServers.push({
      urls: process.env.TURN_SERVER_URL,
      username: process.env.TURN_SERVER_USERNAME,
      credential: process.env.TURN_SERVER_CREDENTIAL,
    });
  }

  const transport = await router.createWebRtcTransport({
    listenIps: [
      {
        ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || undefined,
      },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 1000000,
    // Add TURN servers if configured
    ...(turnServers.length > 0 && { iceServers: turnServers }),
  });

  // Store transport
  if (!transports.has(socketId)) {
    transports.set(socketId, {
      sendTransport: null,
      recvTransport: null,
      producer: null,
      consumers: new Map(),
    });
  }

  const transportData = transports.get(socketId);
  if (direction === "send") {
    transportData.sendTransport = transport;
  } else {
    transportData.recvTransport = transport;
  }

  // Handle transport events
  transport.on("dtlsstatechange", (dtlsState) => {
    if (dtlsState === "closed") {
      // eslint-disable-next-line no-console
      console.log(
        `[mediasoup] Transport DTLS state closed for socket ${socketId}`
      );
    }
  });

  transport.on("close", () => {
    // eslint-disable-next-line no-console
    console.log(`[mediasoup] Transport closed for socket ${socketId}`);
  });

  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
    sctpParameters: transport.sctpParameters,
  };
}

/**
 * Connect transport
 */
export async function connectTransport(
  roomId,
  socketId,
  transportId,
  dtlsParameters
) {
  const transportData = transports.get(socketId);
  if (!transportData) {
    throw new Error("Transport data not found");
  }

  const transport =
    transportData.sendTransport?.id === transportId
      ? transportData.sendTransport
      : transportData.recvTransport?.id === transportId
        ? transportData.recvTransport
        : null;

  if (!transport) {
    throw new Error("Transport not found");
  }

  await transport.connect({ dtlsParameters });
}

/**
 * Create producer (for speakers)
 */
export async function createProducer(roomId, socketId, transportId, rtpParameters) {
  const transportData = transports.get(socketId);
  if (!transportData || !transportData.sendTransport) {
    throw new Error("Send transport not found");
  }

  if (transportData.sendTransport.id !== transportId) {
    throw new Error("Transport ID mismatch");
  }

  const producer = await transportData.sendTransport.produce({
    kind: "audio",
    rtpParameters,
  });

  transportData.producer = producer;

  // Handle producer events
  producer.on("transportclose", () => {
    // eslint-disable-next-line no-console
    console.log(`[mediasoup] Producer transport closed for socket ${socketId}`);
  });

  return {
    id: producer.id,
    kind: producer.kind,
    rtpParameters: producer.rtpParameters,
  };
}

/**
 * Create consumer (for listeners)
 */
export async function createConsumer(
  roomId,
  socketId,
  transportId,
  producerId,
  rtpCapabilities
) {
  const router = getRouter(roomId);
  if (!router) {
    throw new Error("Router not found");
  }

  const transportData = transports.get(socketId);
  if (!transportData || !transportData.recvTransport) {
    throw new Error("Recv transport not found");
  }

  if (transportData.recvTransport.id !== transportId) {
    throw new Error("Transport ID mismatch");
  }

  // Check if we can consume this producer
  if (!router.canConsume({ producerId, rtpCapabilities })) {
    throw new Error("Cannot consume this producer");
  }

  const consumer = await transportData.recvTransport.consume({
    producerId,
    rtpCapabilities,
  });

  transportData.consumers.set(producerId, consumer);

  // Handle consumer events
  consumer.on("transportclose", () => {
    // eslint-disable-next-line no-console
    console.log(`[mediasoup] Consumer transport closed for socket ${socketId}`);
  });

  return {
    id: consumer.id,
    producerId: consumer.producerId,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
  };
}

/**
 * Pause/Resume producer
 */
export async function pauseProducer(socketId) {
  const transportData = transports.get(socketId);
  if (transportData?.producer) {
    await transportData.producer.pause();
  }
}

export async function resumeProducer(socketId) {
  const transportData = transports.get(socketId);
  if (transportData?.producer) {
    await transportData.producer.resume();
  }
}

/**
 * Pause/Resume consumer
 */
export async function pauseConsumer(socketId, consumerId) {
  const transportData = transports.get(socketId);
  const consumer = transportData?.consumers.get(consumerId);
  if (consumer) {
    await consumer.pause();
  }
}

export async function resumeConsumer(socketId, consumerId) {
  const transportData = transports.get(socketId);
  const consumer = transportData?.consumers.get(consumerId);
  if (consumer) {
    await consumer.resume();
  }
}

/**
 * Close transport and cleanup (complete cleanup)
 */
export function closeTransport(socketId) {
  const transportData = transports.get(socketId);
  if (transportData) {
    // eslint-disable-next-line no-console
    console.log(`[mediasoup] Closing transport for socket ${socketId}`);
    
    // Close all consumers first
    transportData.consumers.forEach((consumer, producerId) => {
      try {
        consumer.close();
        // eslint-disable-next-line no-console
        console.log(`[mediasoup] Closed consumer ${consumer.id} for producer ${producerId}`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`[mediasoup] Error closing consumer:`, error);
      }
    });
    transportData.consumers.clear();

    // Close producer
    if (transportData.producer) {
      try {
        transportData.producer.close();
        // eslint-disable-next-line no-console
        console.log(`[mediasoup] Closed producer ${transportData.producer.id}`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`[mediasoup] Error closing producer:`, error);
      }
      transportData.producer = null;
    }

    // Close transports
    if (transportData.sendTransport) {
      try {
        transportData.sendTransport.close();
        // eslint-disable-next-line no-console
        console.log(`[mediasoup] Closed send transport ${transportData.sendTransport.id}`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`[mediasoup] Error closing send transport:`, error);
      }
      transportData.sendTransport = null;
    }
    
    if (transportData.recvTransport) {
      try {
        transportData.recvTransport.close();
        // eslint-disable-next-line no-console
        console.log(`[mediasoup] Closed recv transport ${transportData.recvTransport.id}`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`[mediasoup] Error closing recv transport:`, error);
      }
      transportData.recvTransport = null;
    }

    transports.delete(socketId);
    // eslint-disable-next-line no-console
    console.log(`[mediasoup] Transport cleanup complete for socket ${socketId}`);
  }
}

/**
 * Get router RTP capabilities
 */
export async function getRouterRtpCapabilities(roomId) {
  const router = await getOrCreateRouter(roomId);
  return router.rtpCapabilities;
}

/**
 * Get all producers in a room
 */
export function getRoomProducers(roomId) {
  const producers = [];
  transports.forEach((transportData, socketId) => {
    if (transportData.producer) {
      producers.push({
        socketId,
        producerId: transportData.producer.id,
      });
    }
  });
  return producers;
}

/**
 * Cleanup room (close all transports and delete router)
 */
export async function cleanupRoom(roomId) {
  // Close all transports for this room
  transports.forEach((transportData, socketId) => {
    closeTransport(socketId);
  });

  // Delete router
  await deleteRouter(roomId);
}

