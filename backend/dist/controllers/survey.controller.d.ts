import { Request, Response } from 'express';
export declare class SurveyController {
    /**
     * Create a new survey
     */
    static createSurvey(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get survey by ID
     */
    static getSurvey(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Submit survey response
     */
    static submitResponse(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get survey responses
     */
    static getResponses(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=survey.controller.d.ts.map