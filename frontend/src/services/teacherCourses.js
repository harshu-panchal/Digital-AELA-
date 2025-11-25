import { apiRequest } from "./api/baseClient";

/**
 * Create a new course (teacher only - creates with draft status)
 */
export const createTeacherCourse = async (payload) => {
  const response = await apiRequest("/teacher/courses", {
    method: "POST",
    body: payload,
  });
  
  // Extract modules and quizzes from metadata.syllabus if they exist
  let modules = [];
  let quizzes = [];
  try {
    if (response.course?.metadata?.syllabus) {
      const syllabusValue = response.course.metadata.syllabus;
      // Check if it's already an object
      if (typeof syllabusValue === 'object' && syllabusValue !== null) {
        modules = syllabusValue.modules || [];
        quizzes = syllabusValue.quizzes || [];
      } else if (typeof syllabusValue === 'string') {
        // Only try to parse if it looks like JSON (starts with { or [)
        const trimmed = syllabusValue.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          const parsed = JSON.parse(syllabusValue);
          modules = parsed.modules || [];
          quizzes = parsed.quizzes || [];
        }
        // If it's plain text, just use empty arrays
      }
    }
  } catch (e) {
    // If parsing fails, use empty arrays
    // Silently handle - syllabus might be plain text, not JSON
  }
  
  // Transform backend response to match frontend expectations
  return {
    id: response.course._id,
    ...response.course,
    modules: modules,
    resources: response.course.resources || [],
    enrolments: response.course.enrolments || [],
    quizzes: quizzes,
  };
};

/**
 * Get all courses created by the teacher
 */
export const getTeacherCourses = async () => {
  const response = await apiRequest("/teacher/courses", {
    method: "GET",
  });
  // Transform backend response to match frontend expectations
  return (response.courses || []).map((course) => {
    // Extract modules and quizzes from metadata.syllabus if they exist
    let modules = [];
    let quizzes = [];
    try {
      if (course?.metadata?.syllabus) {
        const syllabusValue = course.metadata.syllabus;
        // Check if it's already an object
        if (typeof syllabusValue === 'object' && syllabusValue !== null) {
          modules = syllabusValue.modules || [];
          quizzes = syllabusValue.quizzes || [];
        } else if (typeof syllabusValue === 'string') {
          // Only try to parse if it looks like JSON (starts with { or [)
          const trimmed = syllabusValue.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            const parsed = JSON.parse(syllabusValue);
            modules = parsed.modules || [];
            quizzes = parsed.quizzes || [];
          }
          // If it's plain text (like "🟦 MODULE..."), just use empty arrays
        }
      }
    } catch (e) {
      // If parsing fails, use empty arrays
      // Silently handle - syllabus might be plain text, not JSON
    }
    
    return {
      id: course._id,
      ...course,
      modules: modules,
      resources: course.resources || [],
      enrolments: course.enrolments || [],
      quizzes: quizzes,
    };
  });
};

/**
 * Get a specific course by ID
 */
export const getTeacherCourseById = async (courseId) => {
  try {
    const response = await apiRequest(`/teacher/courses/${courseId}`, {
      method: "GET",
    });
    
    // Extract modules and quizzes from metadata.syllabus if they exist
    let modules = [];
    let quizzes = [];
    try {
      if (response.course?.metadata?.syllabus) {
        const syllabusValue = response.course.metadata.syllabus;
        // Check if it's already an object
        if (typeof syllabusValue === 'object' && syllabusValue !== null) {
          modules = syllabusValue.modules || [];
          quizzes = syllabusValue.quizzes || [];
        } else if (typeof syllabusValue === 'string') {
          // Only try to parse if it looks like JSON (starts with { or [)
          const trimmed = syllabusValue.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            const parsed = JSON.parse(syllabusValue);
            modules = parsed.modules || [];
            quizzes = parsed.quizzes || [];
          }
          // If it's plain text, just use empty arrays
        }
      }
    } catch (e) {
      // If parsing fails, use empty arrays
      // Silently handle - syllabus might be plain text, not JSON
    }
    
    // Transform backend response to match frontend expectations
    return {
      id: response.course._id,
      ...response.course,
      modules: modules,
      resources: response.course.resources || [],
      enrolments: response.course.enrolments || [],
      quizzes: quizzes,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Update a course (any status - draft, pending, or published)
 */
export const updateTeacherCourse = async (courseId, updates) => {
  const response = await apiRequest(`/teacher/courses/${courseId}`, {
    method: "PUT",
    body: updates,
  });
  
  // Extract modules and quizzes from metadata.syllabus if they exist
  let modules = [];
  let quizzes = [];
  try {
    if (response.course?.metadata?.syllabus) {
      const syllabusValue = response.course.metadata.syllabus;
      // Check if it's already an object
      if (typeof syllabusValue === 'object' && syllabusValue !== null) {
        modules = syllabusValue.modules || [];
        quizzes = syllabusValue.quizzes || [];
      } else if (typeof syllabusValue === 'string') {
        // Only try to parse if it looks like JSON (starts with { or [)
        const trimmed = syllabusValue.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          const parsed = JSON.parse(syllabusValue);
          modules = parsed.modules || [];
          quizzes = parsed.quizzes || [];
        }
        // If it's plain text, just use empty arrays
      }
    }
  } catch (e) {
    // If parsing fails, use empty arrays
    // Silently handle - syllabus might be plain text, not JSON
  }
  
  // Transform backend response to match frontend expectations
  return {
    id: response.course._id,
    ...response.course,
    modules: modules,
    resources: response.course.resources || [],
    enrolments: response.course.enrolments || [],
    quizzes: quizzes,
  };
};

/**
 * Delete a course (any status)
 */
export const deleteTeacherCourse = async (courseId) => {
  const response = await apiRequest(`/teacher/courses/${courseId}`, {
    method: "DELETE",
  });
  return response;
};

/**
 * Upload course brochure PDF
 */
export const uploadCourseBrochure = async (courseId, file) => {
  const formData = new FormData();
  formData.append("brochure", file);

  const response = await apiRequest(`/teacher/courses/${courseId}/brochure`, {
    method: "POST",
    body: formData,
    // Don't set headers - baseClient will handle FormData correctly
  });

  return {
    id: response.course._id,
    ...response.course,
    brochureUrl: response.brochureUrl,
  };
};

const generateId = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const commitCourseChange = async (courseId, mutator) => {
  // Fetch current course from backend
  const currentCourse = await getTeacherCourseById(courseId);
  if (!currentCourse) {
    throw new Error("Course not found");
  }

  // Create a deep clone of the course
  const hasStructuredClone = typeof structuredClone === "function";
  const clone = hasStructuredClone
    ? structuredClone(currentCourse)
    : JSON.parse(JSON.stringify(currentCourse));

  // Ensure modules and quizzes arrays exist (they might come from metadata)
  if (!clone.modules) {
    clone.modules = clone.metadata?.modules || [];
  }
  if (!clone.quizzes) {
    clone.quizzes = clone.metadata?.quizzes || [];
  }

  // Apply the mutation
  mutator(clone);

  // Prepare update payload - store modules and quizzes in metadata
  const updatePayload = {
    // Preserve existing course fields
    title: clone.title,
    description: clone.description,
    category: clone.category,
    price: clone.price,
    coverImage: clone.coverImage || clone.thumbnailUrl,
    introVideoUrl: clone.introVideoUrl || clone.metadata?.introVideoUrl,
    tags: clone.tags || clone.metadata?.tags,
    // Store modules and quizzes in metadata as JSON string in syllabus field
    // The backend stores syllabus as a string, so we'll use it to store the structured data
    syllabus: JSON.stringify({
      modules: clone.modules || [],
      quizzes: clone.quizzes || [],
    }),
  };

  // Update the course via backend API
  const updated = await updateTeacherCourse(courseId, updatePayload);
  
  // Parse modules and quizzes from metadata.syllabus if they exist, otherwise use empty arrays
  let modules = [];
  let quizzes = [];
  try {
    if (updated.metadata?.syllabus) {
      const syllabusValue = updated.metadata.syllabus;
      // Check if it's already an object
      if (typeof syllabusValue === 'object' && syllabusValue !== null) {
        modules = syllabusValue.modules || [];
        quizzes = syllabusValue.quizzes || [];
      } else if (typeof syllabusValue === 'string') {
        // Only try to parse if it looks like JSON (starts with { or [)
        const trimmed = syllabusValue.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          const parsed = JSON.parse(syllabusValue);
          modules = parsed.modules || [];
          quizzes = parsed.quizzes || [];
        }
        // If it's plain text, just use empty arrays
      }
    }
  } catch (e) {
    // If parsing fails, use empty arrays
    // Silently handle - syllabus might be plain text, not JSON
  }
  
  // Return the updated course with modules/lessons/quizzes preserved
  return {
    ...updated,
    modules: modules,
    quizzes: quizzes,
  };
};

export const addCourseModule = async (courseId, moduleInput) =>
  commitCourseChange(courseId, (course) => {
    const moduleId = generateId("module");
    const timestamp = new Date().toISOString();
    const lessons =
      moduleInput?.lessons?.map((lesson, idx) => ({
        id: generateId("lesson"),
        order: idx + 1,
        createdAt: timestamp,
        ...lesson,
      })) ?? [];

    const moduleEntry = {
      id: moduleId,
      title: moduleInput?.title ?? "Untitled module",
      description: moduleInput?.description ?? "",
      order: (course.modules?.length ?? 0) + 1,
      lessons,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    course.modules = Array.isArray(course.modules) ? course.modules : [];
    course.modules.push(moduleEntry);
  });

export const addLessonToModule = async (courseId, moduleId, lessonInput) =>
  commitCourseChange(courseId, (course) => {
    const target = course.modules?.find((module) => module.id === moduleId);
    if (!target) {
      throw new Error("Module not found");
    }
    const lessons = Array.isArray(target.lessons) ? target.lessons : [];
    lessons.push({
      id: generateId("lesson"),
      order: lessons.length + 1,
      createdAt: new Date().toISOString(),
      ...lessonInput,
    });
    target.lessons = lessons;
    target.updatedAt = new Date().toISOString();
  });

export const updateCourseModule = async (courseId, moduleId, updates) =>
  commitCourseChange(courseId, (course) => {
    const target = course.modules?.find((module) => module.id === moduleId);
    if (!target) {
      throw new Error("Module not found");
    }
    Object.assign(target, updates, { updatedAt: new Date().toISOString() });
  });

export const removeCourseModule = async (courseId, moduleId) =>
  commitCourseChange(courseId, (course) => {
    course.modules = (course.modules ?? []).filter((module) => module.id !== moduleId);
    course.modules.forEach((module, index) => {
      module.order = index + 1;
    });
  });

export const moveCourseModule = async (courseId, moduleId, direction) =>
  commitCourseChange(courseId, (course) => {
    const modules = course.modules ?? [];
    const index = modules.findIndex((module) => module.id === moduleId);
    if (index === -1) {
      throw new Error("Module not found");
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) {
      return;
    }
    const [removed] = modules.splice(index, 1);
    modules.splice(targetIndex, 0, removed);
    modules.forEach((module, idx) => {
      module.order = idx + 1;
    });
  });

export const removeLessonFromModule = async (courseId, moduleId, lessonId) =>
  commitCourseChange(courseId, (course) => {
    const module = course.modules?.find((item) => item.id === moduleId);
    if (!module) {
      throw new Error("Module not found");
    }
    module.lessons = (module.lessons ?? []).filter((lesson) => lesson.id !== lessonId);
    module.lessons.forEach((lesson, index) => {
      lesson.order = index + 1;
    });
    module.updatedAt = new Date().toISOString();
  });

export const moveLessonWithinModule = async (courseId, moduleId, lessonId, direction) =>
  commitCourseChange(courseId, (course) => {
    const module = course.modules?.find((item) => item.id === moduleId);
    if (!module) {
      throw new Error("Module not found");
    }
    const lessons = module.lessons ?? [];
    const index = lessons.findIndex((lesson) => lesson.id === lessonId);
    if (index === -1) {
      throw new Error("Lesson not found");
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) {
      return;
    }
    const [removed] = lessons.splice(index, 1);
    lessons.splice(targetIndex, 0, removed);
    lessons.forEach((lesson, idx) => {
      lesson.order = idx + 1;
    });
    module.lessons = lessons;
    module.updatedAt = new Date().toISOString();
  });

export const linkCourseQuiz = async (courseId, quizInput) =>
  commitCourseChange(courseId, (course) => {
    const quizId = quizInput?.id ?? generateId("quiz");
    const entry = {
      id: quizId,
      title: quizInput?.title ?? "Untitled quiz",
      rewardCoins: quizInput?.rewardCoins ?? 0,
      status: quizInput?.status ?? "draft",
      availableUntil: quizInput?.availableUntil ?? null,
      questionsCount: quizInput?.questionsCount ?? 0,
      linkedAt: new Date().toISOString(),
    };

    course.quizzes = Array.isArray(course.quizzes) ? course.quizzes : [];
    course.quizzes = [entry, ...course.quizzes.filter((quiz) => quiz.id !== quizId)];
  });

export const unlinkCourseQuiz = async (courseId, quizId) =>
  commitCourseChange(courseId, (course) => {
    course.quizzes = (course.quizzes ?? []).filter((quiz) => quiz.id !== quizId);
  });

/**
 * Bulk operations for courses
 * POST /api/v1/teacher/courses/bulk
 * @param {Object} payload - { operation, courseIds, ...additionalParams }
 */
export const bulkCourseOperations = async (payload) => {
  const response = await apiRequest("/teacher/courses/bulk", {
    method: "POST",
    body: payload,
  });
  return response;
};

