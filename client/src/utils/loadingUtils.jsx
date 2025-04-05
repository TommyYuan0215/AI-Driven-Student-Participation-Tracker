import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "./axiosUtils";

const useLoadingState = (fetchUrl, params = {}, initialState = []) => {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(fetchUrl, { params });

      if (response.status === 200) {
        setData(response.data.data || response.data);
      } else {
        toast.error("Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(error.response?.data?.message || "Failed to fetch data");
      setData(initialState);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchUrl]);

  return { data, loading, refetch: fetchData };
};

export { useLoadingState };
