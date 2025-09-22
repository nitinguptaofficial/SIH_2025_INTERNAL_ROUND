export interface User {
  id: number;
  name: string;
  email: string;
  rollNumber?: string;
  class?: string;
  subjects?: string;
  role: 'STUDENT';
  faceDescriptor: string;
  createdAt: string;
  attendance?: Attendance[];
}

export interface Teacher {
  id: number;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  createdAt: string;
  token?: string;
}

export interface Attendance {
  id: number;
  userId: number;
  date: string;
  status: 'PRESENT' | 'ABSENT';
  user?: User;
}

export interface StudentWithAttendance extends User {
  attendance: Attendance[];
}
