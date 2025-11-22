import { apiRequest } from "./api/baseClient";

/**
 * Create a new course (teacher only - creates with draft status)
 */
export const createTeacherCourse = async (payload) => {
  const response = await apiRequest("/teacher/courses", {
    method: "POST",
    body: payload,
  });
  // Transform backend response to match frontend expectations
  return {
    id: response.course._id,
    ...response.course,
    modules: response.course.modules || [],
    resources: response.course.resources || [],
    enrolments: response.course.enrolments || [],
    quizzes: response.course.quizzes || [],
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
  return (response.courses || []).map((course) => ({
    id: course._id,
    ...course,
    modules: course.modules || [],
    resources: course.resources || [],
    enrolments: course.enrolments || [],
    quizzes: course.quizzes || [],
  }));
};

/**
 * Get a specific course by ID
 */
export const getTeacherCourseById = async (courseId) => {
  try {
    const response = await apiRequest(`/teacher/courses/${courseId}`, {
      method: "GET",
    });
    // Transform backend response to match frontend expectations
    return {
      id: response.course._id,
      ...response.course,
      modules: response.course.modules || [],
      resources: response.course.resources || [],
      enrolments: response.course.enrolments || [],
      quizzes: response.course.quizzes || [],
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
  // Transform backend response to match frontend expectations
  return {
    id: response.course._id,
    ...response.course,
    modules: response.course.modules || [],
    resources: response.course.resources || [],
    enrolments: response.course.enrolments || [],
    quizzes: response.course.quizzes || [],
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

const commitCourseChange = async (courseId, mutator) => {
  const courses = loadCourses();
  const index = courses.findIndex((course) => course.id === courseId);
  if (index === -1) {
    throw new Error("Course not found");
  }

  const hasStructuredClone = typeof structuredClone === "function";
  const clone = hasStructuredClone
    ? structuredClone(courses[index])
    : JSON.parse(JSON.stringify(courses[index]));
  mutator(clone);
  clone.updatedAt = new Date().toISOString();
  courses[index] = clone;
  persistCourses(courses);
  await new Promise((resolve) => setTimeout(resolve, 350));
  return clone;
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

