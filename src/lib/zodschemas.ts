import { z } from 'zod';
// Password criteria
const minLengthPW = 8;
const maxLengthPW = 20;
const minLengthErrorPW = `Password must be at least ${minLengthPW} characters.`;
const maxLengthErrorPW = `Password must be ${maxLengthPW} characters or fewer.`;
const upperCaseErrorPW = 'Password must contain at least one uppercase letter.';
const lowerCaseErrorPW = 'Password must contain at least one lowercase letter.';
const numberErrorPW = 'Password must containt at least one number.';
const passwordMismatchError = 'Passwords do not match!';

export const passwordSchema = z
	.string()
	.min(minLengthPW, { message: minLengthErrorPW })
	.max(maxLengthPW, { message: maxLengthErrorPW })
	.refine((password) => /[A-Z]/.test(password), { message: upperCaseErrorPW })
	.refine((password) => /[a-z]/.test(password), { message: lowerCaseErrorPW })
	.refine((password) => /[0-9]/.test(password), { message: numberErrorPW });


// Register Form
export const registerSchema = z.object({
	username: z.string().min(2).max(50),
	password: passwordSchema,
	confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
	message: passwordMismatchError,
	path: ['confirmPassword']
});

export type RegisterSchema = typeof registerSchema;
