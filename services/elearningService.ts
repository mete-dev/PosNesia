// This is a new file: services/elearningService.ts
import { Enrollment, CustomerBill, CourseClass, Course, Mentee, Customer } from '../types';
import { generateId } from './serviceUtils';

interface EnrollStudentParams {
    currentMentee: Mentee | null;
    enrollments: Enrollment[];
    customerBills: CustomerBill[];
    courseClasses: CourseClass[];
    courses: Course[];
}

export const enrollStudent = (params: EnrollStudentParams) => {
    const { currentMentee, enrollments, customerBills, courseClasses, courses } = params;

    if (!currentMentee) return null;

    const { courseClassId } = params as any; // Cast to access payload
    const courseClass = courseClasses.find(cc => cc.id === courseClassId);
    if (!courseClass) return null;

    const isEnrolled = enrollments.some(e => e.menteeId === currentMentee!.id && e.courseClassId === courseClassId);
    if (isEnrolled) return null; // Already enrolled

    const newEnrollment: Enrollment = {
        id: generateId('enr', enrollments.length),
        courseClassId,
        menteeId: currentMentee.id,
        enrollmentDate: new Date().toISOString(),
    };

    let updatedCustomerBills = [...customerBills];

    // Create a bill for the enrollment if the course has a price
    if (courseClass.price > 0) {
        const course = courses.find(c => c.id === courseClass.courseId);
        const newBill: CustomerBill = {
            id: generateId('cb', customerBills.length),
            sourceType: 'ElearningEnrollment',
            sourceId: newEnrollment.id,
            description: `Pendaftaran Kursus: ${course?.title || 'Kursus'} - ${courseClass.name}`,
            customerId: currentMentee.id, // Using menteeId as customerId
            customerName: currentMentee.name,
            billDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 day due date
            amount: courseClass.price,
            status: 'Unpaid',
        };
        updatedCustomerBills.push(newBill);
    }
    
    return {
        enrollments: [...enrollments, newEnrollment],
        customerBills: updatedCustomerBills,
    }
};
