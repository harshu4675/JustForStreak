import { repository } from '../services/repositoryService.js';
import { computeDashboardData } from '../services/dashboardService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const records = await repository.listUserAttemptsWithAssessments(req.user.id);
  const { summary } = computeDashboardData(records);

  res.status(200).json({
    success: true,
    data: summary,
  });
});

export const getDashboardProgress = asyncHandler(async (req, res) => {
  const records = await repository.listUserAttemptsWithAssessments(req.user.id);
  const { progress } = computeDashboardData(records);

  res.status(200).json({
    success: true,
    data: progress,
  });
});
