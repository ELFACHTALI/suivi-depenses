import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api.ts";
import { useAuthStore } from "../store/auth.ts";

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: { email: string; password: string; totpToken?: string }) =>
      apiFetch<{ accessToken: string; user: Parameters<typeof setAuth>[0] }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify(data) }
      ),
    onSuccess: ({ accessToken, user }) => {
      setAuth(user, accessToken);
      navigate("/dashboard");
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      name: string;
      referenceCurrency?: string;
    }) =>
      apiFetch<{ accessToken: string; user: Parameters<typeof setAuth>[0] }>(
        "/auth/register",
        { method: "POST", body: JSON.stringify(data) }
      ),
    onSuccess: ({ accessToken, user }) => {
      setAuth(user, accessToken);
      navigate("/dashboard");
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => apiFetch("/auth/logout", { method: "POST" }),
    onSettled: () => {
      clearAuth();
      navigate("/login");
    },
  });
}
