import { useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { ActorSubclass, Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { createActor, canisterId } from "declarations/moodyan_backend";
import { _SERVICE } from "declarations/moodyan_backend/moodyan_backend.did";

const network = process.env.DFX_NETWORK;
const identityProvider =
  network === "local"
    ? "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943"
    : "https://identity.ic0.app";

export const useAuth = () => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [actor, setActor] = useState<ActorSubclass<_SERVICE> | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [principal, setPrincipal] = useState<Principal>(Principal.anonymous());

  useEffect(() => {
    init();
  }, []);

  const init = async (): Promise<void> => {
    const client = await AuthClient.create();
    const identity = client.getIdentity();
    const actorInstance = createActor(canisterId, {
      agentOptions: { identity },
    });

    const authenticated = await client.isAuthenticated();
    setAuthClient(client);
    setActor(actorInstance);
    setIsAuthenticated(authenticated);

    if (authenticated) {
      const principal = identity.getPrincipal();
      setPrincipal(principal);
    }
  };

  const login = async (): Promise<void> => {
    if (!authClient) return;
    await authClient.login({
      identityProvider,
      onSuccess: init,
    });
  };

  const logout = async (): Promise<void> => {
    if (!authClient) return;
    await authClient.logout();
    init();
  };

  return {
    actor,
    isAuthenticated,
    principal,
    login,
    logout,
  };
};
