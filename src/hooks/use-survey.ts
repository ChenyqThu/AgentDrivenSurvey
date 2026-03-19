"use client";

import { useState, useCallback } from "react";

export interface Survey {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  rawInput?: string;
  context?: Record<string, unknown> | null;
  schema?: Record<string, unknown> | null;
  settings?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

interface UseSurveyReturn {
  surveys: Survey[];
  survey: Survey | null;
  loading: boolean;
  error: string | null;
  fetchSurveys: () => Promise<void>;
  fetchSurvey: (id: string) => Promise<Survey | null>;
  createSurvey: (data: CreateSurveyInput) => Promise<Survey | null>;
  publishSurvey: (id: string) => Promise<boolean>;
  updateSurveyStatus: (id: string, status: string) => Promise<boolean>;
}

export interface CreateSurveyInput {
  title: string;
  description?: string;
  rawInput: string;
  context?: {
    product: string;
    targetUsers: string;
    focusAreas: string[];
  };
}

export function useSurvey(): UseSurveyReturn {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/surveys");
      if (!res.ok) throw new Error("Failed to fetch surveys");
      const data = await res.json();
      setSurveys(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSurvey = useCallback(async (id: string): Promise<Survey | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/surveys/${id}`);
      if (!res.ok) throw new Error("Failed to fetch survey");
      const data: Survey = await res.json();
      setSurvey(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSurvey = useCallback(
    async (input: CreateSurveyInput): Promise<Survey | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/surveys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to create survey");
        }
        const data: Survey = await res.json();
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const publishSurvey = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/surveys/${id}/publish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to publish survey");
      const data: Survey = await res.json();
      setSurvey(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSurveyStatus = useCallback(
    async (id: string, status: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/surveys/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error("Failed to update status");
        const data: Survey = await res.json();
        setSurvey(data);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    surveys,
    survey,
    loading,
    error,
    fetchSurveys,
    fetchSurvey,
    createSurvey,
    publishSurvey,
    updateSurveyStatus,
  };
}
