import { Request, Response } from 'express';
import { query } from '../config/database';

export class SensoryController {
  /**
   * Soft delete sensory evaluation
   */
  static async softDeleteEvaluation(req: Request, res: Response) {
    try {
      const { evaluation_id } = req.params;

      // Check if evaluation exists
      const evaluationResult = await query(
        'SELECT * FROM sensory_evaluations WHERE evaluation_id = $1 AND is_deleted = false LIMIT 1',
        [evaluation_id]
      );

      if (evaluationResult.rows.length === 0) {
        return res.status(404).json({ error: 'Sensory evaluation not found' });
      }

      // Soft delete evaluation and related data
      await query('UPDATE sensory_evaluations SET is_deleted = true WHERE evaluation_id = $1', [evaluation_id]);
      await query('UPDATE sensory_products SET is_deleted = true WHERE evaluation_id = $1', [evaluation_id]);

      res.json({ message: 'Sensory evaluation deleted successfully' });
    } catch (error) {
      console.error('Error deleting sensory evaluation:', error);
      res.status(500).json({ error: 'Failed to delete sensory evaluation' });
    }
  }

  /**
   * Soft delete sensory evaluation response
   */
  static async softDeleteEvaluationResponse(req: Request, res: Response) {
    try {
      const { evaluation_id, response_id } = req.params;

      await query('UPDATE sensory_evaluations SET is_deleted = true WHERE id = $1 AND evaluation_id = $2', [response_id, evaluation_id]);

      res.json({ message: 'Evaluation response deleted successfully' });
    } catch (error) {
      console.error('Error deleting evaluation response:', error);
      res.status(500).json({ error: 'Failed to delete evaluation response' });
    }
  }

  /**
   * Get sensory evaluations list
   */
  static async getEvaluations(req: Request, res: Response) {
    try {
      const result = await query(`
        SELECT
          se.evaluation_id,
          COUNT(DISTINCT se.id) as total_responses,
          COUNT(DISTINCT sp.id) as total_products,
          MAX(se.submitted_at) as last_submission
        FROM sensory_evaluations se
        LEFT JOIN sensory_products sp ON se.evaluation_id = sp.evaluation_id
        WHERE se.is_deleted = false
        GROUP BY se.evaluation_id
        ORDER BY last_submission DESC
      `);

      res.json({
        evaluations: result.rows,
        total: result.rowCount
      });
    } catch (error) {
      console.error('Error fetching sensory evaluations:', error);
      res.status(500).json({ error: 'Failed to fetch sensory evaluations' });
    }
  }
}
