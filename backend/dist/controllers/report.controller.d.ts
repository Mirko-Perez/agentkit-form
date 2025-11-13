import { Request, Response } from 'express';
export declare class ReportController {
    /**
     * Generate survey report with statistics
     */
    static generateReport(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get dashboard overview
     */
    static getDashboardOverview(req: Request, res: Response): Promise<void>;
    /**
     * Calculate statistics for each question
     */
    private static calculateQuestionStats;
}
//# sourceMappingURL=report.controller.d.ts.map