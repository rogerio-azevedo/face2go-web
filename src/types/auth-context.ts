export type UserContextType =
    | "super_admin"
    | "company"
    | "client"
    | "responsible"
    | "face_user";

export type UserContext =
    | {
          type: "super_admin";
          contextId: "super_admin";
          label: string;
      }
    | {
          type: "company";
          contextId: string;
          companyUserId: string;
          companyId: string;
          companyName: string;
          logoUrl: string | null;
          role: "company_admin" | "company_operator";
          label: string;
      }
    | {
          type: "client";
          contextId: string;
          clientUserId: string;
          clientId: string;
          clientName: string;
          companyId: string;
          role: "client_admin" | "client_operator";
          label: string;
      }
    | {
          type: "responsible";
          contextId: string;
          responsibleId: string;
          clientId: string;
          clientName: string;
          label: string;
      }
    | {
          type: "face_user";
          contextId: "face_user";
          label: string;
      };

export type LoginResponse = {
    user: {
        id: string;
        email: string;
        name?: string | null;
        cpf?: string | null;
    };
    contexts: UserContext[];
    identityToken: string;
};

/** Resposta legada do backend em produção (login direto com accessToken). */
export type LegacyLoginResponse = {
    accessToken: string;
    user: {
        id: string;
        email: string;
        name?: string | null;
        role: string;
        companyId?: string;
        clientId?: string;
        companyUserId?: string;
        clientUserId?: string;
        responsibleId?: string;
    };
};

export type LoginApiResponse = LoginResponse | LegacyLoginResponse;

export type SelectContextResponse = {
    accessToken: string;
    context: UserContext;
    user: {
        id: string;
        email: string;
        name?: string | null;
        role: string;
        companyId?: string;
        clientId?: string;
        companyUserId?: string;
        clientUserId?: string;
        responsibleId?: string;
    };
};
