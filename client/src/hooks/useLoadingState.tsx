import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "../utils/axiosUtils";

export function useLoadingState<T = any>(
  fetchUrl: string,
  params: Record<string, any> = {},
  initialState: T = [] as unknown as T
) {
  const [data, setData] = useState<T>(initialState);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(fetchUrl, { params });

      if (response.status === 200) {
        setData(response.data.data ?? response.data);
      } else {
        toast.error("Failed to fetch data");
      }
    } catch (error: any) {
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
}
