import { useEffect, useState } from "react";
import Login from "./components/Login";
import {
  getDashboardSummary,
  getDashboardStartups,
} from "./services/dashboardService";

function Dashboard({ onLogout }) {
  const [summary, setSummary] = useState(null);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [summaryData, startupsData] = await Promise.all([
          getDashboardSummary(),
          getDashboardStartups(),
        ]);

        setSummary(summaryData.data);
        setStartups(startupsData.data);
      } catch (err) {
        console.error("Dashboard loading error:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          onLogout();
          return;
        }

        setError(
          err.response?.data?.message ||
            "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [onLogout]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg font-semibold text-gray-700">
          Loading DTBi Dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-3">
            Dashboard Error
          </h2>

          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              DTBi Dashboard
            </h1>

            <p className="text-gray-600 mt-1">
              Tanzania Data and Technology Business Incubator
            </p>
          </div>

          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">
              Total Startups
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {summary?.total_startups || 0}
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">
              Total Investors
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {summary?.total_investors || 0}
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">
              Investments
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {summary?.total_investments || 0}
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">
              Investment Amount
            </p>

            <h2 className="text-2xl font-bold mt-2">
              TZS{" "}
              {Number(
                summary?.total_investment_amount || 0
              ).toLocaleString()}
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">
              CSV Uploads
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {summary?.total_uploads || 0}
            </h2>
          </div>

        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">

          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">
              Registered Startups
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Startup information from the DTBi database
            </p>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Industry</th>
                  <th className="text-left p-4">Location</th>
                  <th className="text-left p-4">Founded</th>
                  <th className="text-left p-4">Revenue</th>
                  <th className="text-left p-4">Growth</th>
                </tr>
              </thead>

              <tbody>
                {startups.map((startup) => (
                  <tr
                    key={startup.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4 font-medium">
                      {startup.name}
                    </td>

                    <td className="p-4">
                      {startup.industry || "-"}
                    </td>

                    <td className="p-4">
                      {startup.location || "-"}
                    </td>

                    <td className="p-4">
                      {startup.founded_year || "-"}
                    </td>

                    <td className="p-4">
                      {startup.revenue
                        ? `TZS ${Number(
                            startup.revenue
                          ).toLocaleString()}`
                        : "-"}
                    </td>

                    <td className="p-4">
                      {startup.growth_rate !== null &&
                      startup.growth_rate !== undefined
                        ? `${startup.growth_rate}%`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        </div>

      </div>
    </div>
  );
}

function App() {
  const [authenticated, setAuthenticated] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const handleLogin = () => {
    setAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthenticated(false);
  };

  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}

export default App;