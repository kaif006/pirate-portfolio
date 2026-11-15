import { z } from 'zod'

const noLineBreaks = (value: string) => !/[\r\n]/.test(value)

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80, 'Name is too long')
    .refine(noLineBreaks, 'Invalid characters'),
  email: z.string().trim().email('Enter a valid email address').max(120)
    .refine(noLineBreaks, 'Invalid characters'),
  subject: z.string().trim().min(3, 'Subject is too short').max(120, 'Subject is too long')
    .refine(noLineBreaks, 'Invalid characters'),
  message: z.string().trim().min(10, 'Message is too short').max(2000, 'Message is too long'),
  // Honeypot: real visitors never see or fill this field.
  website: z.string().max(200).optional(),
})

export const chatSchema = z.object({
  message: z.string().trim().min(2, 'Question is too short').max(500, 'Question is too long'),
})
