'use server';

/**
 * @fileOverview AI-powered attendance analytics flow that generates reports, visualizations, and insights for admins and faculty.
 *
 * - generateAttendanceInsights - A function that orchestrates the process of generating attendance reports, visualizations, and AI-driven insights.
 * - AttendanceInsightsInput - The input type for the generateAttendanceInsights function, including attendance data and analysis preferences.
 * - AttendanceInsightsOutput - The return type for the generateAttendanceInsights function, providing reports, visualizations, and AI-generated insights.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AttendanceInsightsInputSchema = z.object({
  attendanceData: z.string().describe('Attendance data in JSON format, including student IDs, class names, dates, and attendance status.'),
  analysisPreferences: z.string().describe('Preferences for the analysis, such as specific classes, students, or date ranges to focus on.'),
  reportFormat: z.enum(['PDF', 'Excel']).describe('Preferred format for the attendance report.'),
  visualizationTypes: z.array(z.enum(['bar', 'pie', 'line'])).optional().describe('Types of visualizations to generate (e.g., bar charts, pie charts, line graphs).'),
});
export type AttendanceInsightsInput = z.infer<typeof AttendanceInsightsInputSchema>;

const AttendanceInsightsOutputSchema = z.object({
  report: z.string().describe('The generated attendance report as a Base64 encoded string.'),
  reportFormat: z.enum(['PDF', 'Excel']).describe('The format of the generated report.'),
  visualizations: z.array(z.string()).describe('URLs or data URIs of the generated visualizations.'),
  insights: z.string().describe('AI-generated insights, including identification of at-risk students and attendance trends.'),
});
export type AttendanceInsightsOutput = z.infer<typeof AttendanceInsightsOutputSchema>;

export async function generateAttendanceInsights(input: AttendanceInsightsInput): Promise<AttendanceInsightsOutput> {
  return attendanceAnalyticsInsightsFlow(input);
}

const attendanceAnalyticsInsightsPrompt = ai.definePrompt({
  name: 'attendanceAnalyticsInsightsPrompt',
  input: {schema: AttendanceInsightsInputSchema},
  output: {schema: AttendanceInsightsOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing attendance data and providing actionable insights.

  You will receive attendance data, analysis preferences, and desired report/visualization formats. Your task is to:

  1.  Generate a comprehensive attendance report in the specified {{{reportFormat}}} format.
  2.  Create visualizations (bar charts, pie charts, and line graphs) to represent attendance trends and statistics.
  3.  Analyze the data to identify students at risk of failing due to poor attendance.
  4.  Highlight significant trends in class attendance, such as patterns of absenteeism or consistently low attendance rates.

  Use the following attendance data:
  {{attendanceData}}

  Analysis Preferences:
  {{analysisPreferences}}

  Deliver the report, visualizations, and insights in a structured format, ensuring they are easy to understand and actionable for admins and faculty.

  The report MUST be returned as a Base64 encoded string in the 'report' field.
  The visualizations should be returned as data URIs.
`,
});

const attendanceAnalyticsInsightsFlow = ai.defineFlow(
  {
    name: 'attendanceAnalyticsInsightsFlow',
    inputSchema: AttendanceInsightsInputSchema,
    outputSchema: AttendanceInsightsOutputSchema,
  },
  async input => {
    const {output} = await attendanceAnalyticsInsightsPrompt(input);
    return output!;
  }
);
