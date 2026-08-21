import api from "./api";

export const getDashboardSummary = async () => {
  const response = await api.get("/dashboard/summary");
  return response.data;
};

export const getDashboardStartups = async () => {
  const response = await api.get("/dashboard/startups");
  return response.data;
};

export const getInvestorDashboard = async () => {
  const response = await api.get("/dashboard/investor");
  return response.data;
};

export const getStartupDashboard = async () => {
  const response = await api.get("/dashboard/startup");
  return response.data;
};