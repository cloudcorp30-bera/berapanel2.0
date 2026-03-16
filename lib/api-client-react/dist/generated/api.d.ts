import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AdminAdjustCoinsBody, AdminBanUserBody, AdminBulkCoinsBody, AdminDashboard, AdminListProjectsParams, AdminListTicketsParams, AdminListTransactionsParams, AdminListUsersParams, AdminSendNotificationBody, AdminSetRoleBody, AdminUserDetail, Airdrop, AirdropClaim, AnalyticsData, Announcement, ApiKey, ApiKeyWithSecret, AuditEntry, AuthResponse, Badge, BotCategory, BotReview, BotTemplate, ChangePasswordBody, CloneProjectBody, CoinBalance, CoinPackage, CreateAirdropBody, CreateAnnouncementBody, CreateApiKeyBody, CreateBotBody, CreateCoinPackageBody, CreateCronBody, CreateProjectBody, CreateProjectFileBody, CreatePromoCodeBody, CreateTicketBody, CronJob, DeleteProjectFileParams, DeployBotBody, DeployHistory, DeployProjectBody, EarnOption, EconomyOverview, EmergencyBroadcastBody, ErrorResponse, ForgotPasswordBody, GetAuditLogParams, GetCoinHistory200, GetCoinHistoryParams, GetFileContent200, GetFileContentParams, GetProjectEnv200, GetProjectLogs200, GetProjectLogsParams, GetProjectMetricsParams, HealthStatus, InitiatePaymentBody, LeaderboardEntry, ListNotificationsParams, ListProjectFiles200, LiveUrlResponse, LoginBody, Notification, PaginatedProjects, PaginatedTransactions, PaginatedUsers, PaymentInitiateResponse, PaymentStatus, PlatformSettings, PlatformStatus, Project, ProjectMetric, PromoCode, RedeemPromoCodeBody, ReferralInfo, RefreshToken200, RefreshTokenBody, RegisterBody, RenameProjectFileBody, ResetPasswordBody, ReviewBotBody, SaveFileContentBody, SendTicketMessageBody, StreakClaimResponse, StreakStatus, SuccessResponse, SupportTicket, SupportTicketDetail, SystemInfo, Template, Transaction, TransferCoinsBody, UpdatePlatformSettingsBody, UpdateProfileBody, UpdateProjectBody, UpdateProjectEnvBody, UpdateReferralConfigBody, User, UserSession } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getRegisterUrl: () => string;
export declare const register: (registerBody: RegisterBody, options?: RequestInit) => Promise<AuthResponse>;
export declare const getRegisterMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterBody>;
}, TContext>;
export type RegisterMutationResult = NonNullable<Awaited<ReturnType<typeof register>>>;
export type RegisterMutationBody = BodyType<RegisterBody>;
export type RegisterMutationError = ErrorType<ErrorResponse>;
export declare const useRegister: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterBody>;
}, TContext>;
export declare const getLoginUrl: () => string;
export declare const login: (loginBody: LoginBody, options?: RequestInit) => Promise<AuthResponse>;
export declare const getLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginBody>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginBody>;
export type LoginMutationError = ErrorType<ErrorResponse>;
export declare const useLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginBody>;
}, TContext>;
export declare const getRefreshTokenUrl: () => string;
export declare const refreshToken: (refreshTokenBody: RefreshTokenBody, options?: RequestInit) => Promise<RefreshToken200>;
export declare const getRefreshTokenMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof refreshToken>>, TError, {
        data: BodyType<RefreshTokenBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof refreshToken>>, TError, {
    data: BodyType<RefreshTokenBody>;
}, TContext>;
export type RefreshTokenMutationResult = NonNullable<Awaited<ReturnType<typeof refreshToken>>>;
export type RefreshTokenMutationBody = BodyType<RefreshTokenBody>;
export type RefreshTokenMutationError = ErrorType<unknown>;
export declare const useRefreshToken: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof refreshToken>>, TError, {
        data: BodyType<RefreshTokenBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof refreshToken>>, TError, {
    data: BodyType<RefreshTokenBody>;
}, TContext>;
export declare const getLogoutUrl: () => string;
export declare const logout: (options?: RequestInit) => Promise<SuccessResponse>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export declare const getGetMeUrl: () => string;
export declare const getMe: (options?: RequestInit) => Promise<User>;
export declare const getGetMeQueryKey: () => readonly ["/api/brucepanel/auth/me"];
export declare const getGetMeQueryOptions: <TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMeQueryResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type GetMeQueryError = ErrorType<unknown>;
export declare function useGetMe<TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getChangePasswordUrl: () => string;
export declare const changePassword: (changePasswordBody: ChangePasswordBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getChangePasswordMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof changePassword>>, TError, {
        data: BodyType<ChangePasswordBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof changePassword>>, TError, {
    data: BodyType<ChangePasswordBody>;
}, TContext>;
export type ChangePasswordMutationResult = NonNullable<Awaited<ReturnType<typeof changePassword>>>;
export type ChangePasswordMutationBody = BodyType<ChangePasswordBody>;
export type ChangePasswordMutationError = ErrorType<unknown>;
export declare const useChangePassword: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof changePassword>>, TError, {
        data: BodyType<ChangePasswordBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof changePassword>>, TError, {
    data: BodyType<ChangePasswordBody>;
}, TContext>;
export declare const getForgotPasswordUrl: () => string;
export declare const forgotPassword: (forgotPasswordBody: ForgotPasswordBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getForgotPasswordMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof forgotPassword>>, TError, {
        data: BodyType<ForgotPasswordBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof forgotPassword>>, TError, {
    data: BodyType<ForgotPasswordBody>;
}, TContext>;
export type ForgotPasswordMutationResult = NonNullable<Awaited<ReturnType<typeof forgotPassword>>>;
export type ForgotPasswordMutationBody = BodyType<ForgotPasswordBody>;
export type ForgotPasswordMutationError = ErrorType<unknown>;
export declare const useForgotPassword: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof forgotPassword>>, TError, {
        data: BodyType<ForgotPasswordBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof forgotPassword>>, TError, {
    data: BodyType<ForgotPasswordBody>;
}, TContext>;
export declare const getResetPasswordUrl: () => string;
export declare const resetPassword: (resetPasswordBody: ResetPasswordBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getResetPasswordMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resetPassword>>, TError, {
        data: BodyType<ResetPasswordBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof resetPassword>>, TError, {
    data: BodyType<ResetPasswordBody>;
}, TContext>;
export type ResetPasswordMutationResult = NonNullable<Awaited<ReturnType<typeof resetPassword>>>;
export type ResetPasswordMutationBody = BodyType<ResetPasswordBody>;
export type ResetPasswordMutationError = ErrorType<unknown>;
export declare const useResetPassword: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resetPassword>>, TError, {
        data: BodyType<ResetPasswordBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof resetPassword>>, TError, {
    data: BodyType<ResetPasswordBody>;
}, TContext>;
export declare const getListProjectsUrl: () => string;
export declare const listProjects: (options?: RequestInit) => Promise<Project[]>;
export declare const getListProjectsQueryKey: () => readonly ["/api/brucepanel/projects"];
export declare const getListProjectsQueryOptions: <TData = Awaited<ReturnType<typeof listProjects>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProjects>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProjects>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProjectsQueryResult = NonNullable<Awaited<ReturnType<typeof listProjects>>>;
export type ListProjectsQueryError = ErrorType<unknown>;
export declare function useListProjects<TData = Awaited<ReturnType<typeof listProjects>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProjects>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateProjectUrl: () => string;
export declare const createProject: (createProjectBody: CreateProjectBody, options?: RequestInit) => Promise<Project>;
export declare const getCreateProjectMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProject>>, TError, {
        data: BodyType<CreateProjectBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createProject>>, TError, {
    data: BodyType<CreateProjectBody>;
}, TContext>;
export type CreateProjectMutationResult = NonNullable<Awaited<ReturnType<typeof createProject>>>;
export type CreateProjectMutationBody = BodyType<CreateProjectBody>;
export type CreateProjectMutationError = ErrorType<unknown>;
export declare const useCreateProject: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProject>>, TError, {
        data: BodyType<CreateProjectBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createProject>>, TError, {
    data: BodyType<CreateProjectBody>;
}, TContext>;
export declare const getGetProjectUrl: (id: string) => string;
export declare const getProject: (id: string, options?: RequestInit) => Promise<Project>;
export declare const getGetProjectQueryKey: (id: string) => readonly [`/api/brucepanel/projects/${string}`];
export declare const getGetProjectQueryOptions: <TData = Awaited<ReturnType<typeof getProject>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProject>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProject>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProjectQueryResult = NonNullable<Awaited<ReturnType<typeof getProject>>>;
export type GetProjectQueryError = ErrorType<unknown>;
export declare function useGetProject<TData = Awaited<ReturnType<typeof getProject>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProject>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeleteProjectUrl: (id: string) => string;
export declare const deleteProject: (id: string, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getDeleteProjectMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProject>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteProject>>, TError, {
    id: string;
}, TContext>;
export type DeleteProjectMutationResult = NonNullable<Awaited<ReturnType<typeof deleteProject>>>;
export type DeleteProjectMutationError = ErrorType<unknown>;
export declare const useDeleteProject: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProject>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteProject>>, TError, {
    id: string;
}, TContext>;
export declare const getUpdateProjectSettingsUrl: (id: string) => string;
export declare const updateProjectSettings: (id: string, updateProjectBody: UpdateProjectBody, options?: RequestInit) => Promise<Project>;
export declare const getUpdateProjectSettingsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProjectSettings>>, TError, {
        id: string;
        data: BodyType<UpdateProjectBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateProjectSettings>>, TError, {
    id: string;
    data: BodyType<UpdateProjectBody>;
}, TContext>;
export type UpdateProjectSettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updateProjectSettings>>>;
export type UpdateProjectSettingsMutationBody = BodyType<UpdateProjectBody>;
export type UpdateProjectSettingsMutationError = ErrorType<unknown>;
export declare const useUpdateProjectSettings: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProjectSettings>>, TError, {
        id: string;
        data: BodyType<UpdateProjectBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateProjectSettings>>, TError, {
    id: string;
    data: BodyType<UpdateProjectBody>;
}, TContext>;
export declare const getStartProjectUrl: (id: string) => string;
export declare const startProject: (id: string, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getStartProjectMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof startProject>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof startProject>>, TError, {
    id: string;
}, TContext>;
export type StartProjectMutationResult = NonNullable<Awaited<ReturnType<typeof startProject>>>;
export type StartProjectMutationError = ErrorType<unknown>;
export declare const useStartProject: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof startProject>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof startProject>>, TError, {
    id: string;
}, TContext>;
export declare const getStopProjectUrl: (id: string) => string;
export declare const stopProject: (id: string, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getStopProjectMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof stopProject>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof stopProject>>, TError, {
    id: string;
}, TContext>;
export type StopProjectMutationResult = NonNullable<Awaited<ReturnType<typeof stopProject>>>;
export type StopProjectMutationError = ErrorType<unknown>;
export declare const useStopProject: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof stopProject>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof stopProject>>, TError, {
    id: string;
}, TContext>;
export declare const getRestartProjectUrl: (id: string) => string;
export declare const restartProject: (id: string, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getRestartProjectMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof restartProject>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof restartProject>>, TError, {
    id: string;
}, TContext>;
export type RestartProjectMutationResult = NonNullable<Awaited<ReturnType<typeof restartProject>>>;
export type RestartProjectMutationError = ErrorType<unknown>;
export declare const useRestartProject: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof restartProject>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof restartProject>>, TError, {
    id: string;
}, TContext>;
export declare const getDeployProjectUrl: (id: string) => string;
export declare const deployProject: (id: string, deployProjectBody?: DeployProjectBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getDeployProjectMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deployProject>>, TError, {
        id: string;
        data: BodyType<DeployProjectBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deployProject>>, TError, {
    id: string;
    data: BodyType<DeployProjectBody>;
}, TContext>;
export type DeployProjectMutationResult = NonNullable<Awaited<ReturnType<typeof deployProject>>>;
export type DeployProjectMutationBody = BodyType<DeployProjectBody>;
export type DeployProjectMutationError = ErrorType<unknown>;
export declare const useDeployProject: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deployProject>>, TError, {
        id: string;
        data: BodyType<DeployProjectBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deployProject>>, TError, {
    id: string;
    data: BodyType<DeployProjectBody>;
}, TContext>;
export declare const getGetDeployHistoryUrl: (id: string) => string;
export declare const getDeployHistory: (id: string, options?: RequestInit) => Promise<DeployHistory[]>;
export declare const getGetDeployHistoryQueryKey: (id: string) => readonly [`/api/brucepanel/projects/${string}/deploy-history`];
export declare const getGetDeployHistoryQueryOptions: <TData = Awaited<ReturnType<typeof getDeployHistory>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDeployHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDeployHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDeployHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof getDeployHistory>>>;
export type GetDeployHistoryQueryError = ErrorType<unknown>;
export declare function useGetDeployHistory<TData = Awaited<ReturnType<typeof getDeployHistory>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDeployHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetProjectMetricsUrl: (id: string, params?: GetProjectMetricsParams) => string;
export declare const getProjectMetrics: (id: string, params?: GetProjectMetricsParams, options?: RequestInit) => Promise<ProjectMetric[]>;
export declare const getGetProjectMetricsQueryKey: (id: string, params?: GetProjectMetricsParams) => readonly [`/api/brucepanel/projects/${string}/metrics`, ...GetProjectMetricsParams[]];
export declare const getGetProjectMetricsQueryOptions: <TData = Awaited<ReturnType<typeof getProjectMetrics>>, TError = ErrorType<unknown>>(id: string, params?: GetProjectMetricsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProjectMetrics>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProjectMetrics>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProjectMetricsQueryResult = NonNullable<Awaited<ReturnType<typeof getProjectMetrics>>>;
export type GetProjectMetricsQueryError = ErrorType<unknown>;
export declare function useGetProjectMetrics<TData = Awaited<ReturnType<typeof getProjectMetrics>>, TError = ErrorType<unknown>>(id: string, params?: GetProjectMetricsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProjectMetrics>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetProjectLiveUrlUrl: (id: string) => string;
export declare const getProjectLiveUrl: (id: string, options?: RequestInit) => Promise<LiveUrlResponse>;
export declare const getGetProjectLiveUrlQueryKey: (id: string) => readonly [`/api/brucepanel/projects/${string}/liveurl`];
export declare const getGetProjectLiveUrlQueryOptions: <TData = Awaited<ReturnType<typeof getProjectLiveUrl>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProjectLiveUrl>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProjectLiveUrl>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProjectLiveUrlQueryResult = NonNullable<Awaited<ReturnType<typeof getProjectLiveUrl>>>;
export type GetProjectLiveUrlQueryError = ErrorType<unknown>;
export declare function useGetProjectLiveUrl<TData = Awaited<ReturnType<typeof getProjectLiveUrl>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProjectLiveUrl>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCloneProjectUrl: (id: string) => string;
export declare const cloneProject: (id: string, cloneProjectBody: CloneProjectBody, options?: RequestInit) => Promise<Project>;
export declare const getCloneProjectMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cloneProject>>, TError, {
        id: string;
        data: BodyType<CloneProjectBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof cloneProject>>, TError, {
    id: string;
    data: BodyType<CloneProjectBody>;
}, TContext>;
export type CloneProjectMutationResult = NonNullable<Awaited<ReturnType<typeof cloneProject>>>;
export type CloneProjectMutationBody = BodyType<CloneProjectBody>;
export type CloneProjectMutationError = ErrorType<unknown>;
export declare const useCloneProject: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cloneProject>>, TError, {
        id: string;
        data: BodyType<CloneProjectBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof cloneProject>>, TError, {
    id: string;
    data: BodyType<CloneProjectBody>;
}, TContext>;
export declare const getGetProjectLogsUrl: (id: string, params?: GetProjectLogsParams) => string;
export declare const getProjectLogs: (id: string, params?: GetProjectLogsParams, options?: RequestInit) => Promise<GetProjectLogs200>;
export declare const getGetProjectLogsQueryKey: (id: string, params?: GetProjectLogsParams) => readonly [`/api/brucepanel/projects/${string}/logs`, ...GetProjectLogsParams[]];
export declare const getGetProjectLogsQueryOptions: <TData = Awaited<ReturnType<typeof getProjectLogs>>, TError = ErrorType<unknown>>(id: string, params?: GetProjectLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProjectLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProjectLogs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProjectLogsQueryResult = NonNullable<Awaited<ReturnType<typeof getProjectLogs>>>;
export type GetProjectLogsQueryError = ErrorType<unknown>;
export declare function useGetProjectLogs<TData = Awaited<ReturnType<typeof getProjectLogs>>, TError = ErrorType<unknown>>(id: string, params?: GetProjectLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProjectLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListProjectFilesUrl: (id: string) => string;
export declare const listProjectFiles: (id: string, options?: RequestInit) => Promise<ListProjectFiles200>;
export declare const getListProjectFilesQueryKey: (id: string) => readonly [`/api/brucepanel/projects/${string}/files`];
export declare const getListProjectFilesQueryOptions: <TData = Awaited<ReturnType<typeof listProjectFiles>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProjectFiles>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProjectFiles>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProjectFilesQueryResult = NonNullable<Awaited<ReturnType<typeof listProjectFiles>>>;
export type ListProjectFilesQueryError = ErrorType<unknown>;
export declare function useListProjectFiles<TData = Awaited<ReturnType<typeof listProjectFiles>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProjectFiles>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeleteProjectFileUrl: (id: string, params: DeleteProjectFileParams) => string;
export declare const deleteProjectFile: (id: string, params: DeleteProjectFileParams, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getDeleteProjectFileMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProjectFile>>, TError, {
        id: string;
        params: DeleteProjectFileParams;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteProjectFile>>, TError, {
    id: string;
    params: DeleteProjectFileParams;
}, TContext>;
export type DeleteProjectFileMutationResult = NonNullable<Awaited<ReturnType<typeof deleteProjectFile>>>;
export type DeleteProjectFileMutationError = ErrorType<unknown>;
export declare const useDeleteProjectFile: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProjectFile>>, TError, {
        id: string;
        params: DeleteProjectFileParams;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteProjectFile>>, TError, {
    id: string;
    params: DeleteProjectFileParams;
}, TContext>;
export declare const getGetFileContentUrl: (id: string, params: GetFileContentParams) => string;
export declare const getFileContent: (id: string, params: GetFileContentParams, options?: RequestInit) => Promise<GetFileContent200>;
export declare const getGetFileContentQueryKey: (id: string, params?: GetFileContentParams) => readonly [`/api/brucepanel/projects/${string}/files/content`, ...GetFileContentParams[]];
export declare const getGetFileContentQueryOptions: <TData = Awaited<ReturnType<typeof getFileContent>>, TError = ErrorType<unknown>>(id: string, params: GetFileContentParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFileContent>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getFileContent>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetFileContentQueryResult = NonNullable<Awaited<ReturnType<typeof getFileContent>>>;
export type GetFileContentQueryError = ErrorType<unknown>;
export declare function useGetFileContent<TData = Awaited<ReturnType<typeof getFileContent>>, TError = ErrorType<unknown>>(id: string, params: GetFileContentParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFileContent>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSaveFileContentUrl: (id: string) => string;
export declare const saveFileContent: (id: string, saveFileContentBody: SaveFileContentBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getSaveFileContentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveFileContent>>, TError, {
        id: string;
        data: BodyType<SaveFileContentBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof saveFileContent>>, TError, {
    id: string;
    data: BodyType<SaveFileContentBody>;
}, TContext>;
export type SaveFileContentMutationResult = NonNullable<Awaited<ReturnType<typeof saveFileContent>>>;
export type SaveFileContentMutationBody = BodyType<SaveFileContentBody>;
export type SaveFileContentMutationError = ErrorType<unknown>;
export declare const useSaveFileContent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveFileContent>>, TError, {
        id: string;
        data: BodyType<SaveFileContentBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof saveFileContent>>, TError, {
    id: string;
    data: BodyType<SaveFileContentBody>;
}, TContext>;
export declare const getCreateProjectFileUrl: (id: string) => string;
export declare const createProjectFile: (id: string, createProjectFileBody: CreateProjectFileBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getCreateProjectFileMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProjectFile>>, TError, {
        id: string;
        data: BodyType<CreateProjectFileBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createProjectFile>>, TError, {
    id: string;
    data: BodyType<CreateProjectFileBody>;
}, TContext>;
export type CreateProjectFileMutationResult = NonNullable<Awaited<ReturnType<typeof createProjectFile>>>;
export type CreateProjectFileMutationBody = BodyType<CreateProjectFileBody>;
export type CreateProjectFileMutationError = ErrorType<unknown>;
export declare const useCreateProjectFile: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProjectFile>>, TError, {
        id: string;
        data: BodyType<CreateProjectFileBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createProjectFile>>, TError, {
    id: string;
    data: BodyType<CreateProjectFileBody>;
}, TContext>;
export declare const getRenameProjectFileUrl: (id: string) => string;
export declare const renameProjectFile: (id: string, renameProjectFileBody: RenameProjectFileBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getRenameProjectFileMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof renameProjectFile>>, TError, {
        id: string;
        data: BodyType<RenameProjectFileBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof renameProjectFile>>, TError, {
    id: string;
    data: BodyType<RenameProjectFileBody>;
}, TContext>;
export type RenameProjectFileMutationResult = NonNullable<Awaited<ReturnType<typeof renameProjectFile>>>;
export type RenameProjectFileMutationBody = BodyType<RenameProjectFileBody>;
export type RenameProjectFileMutationError = ErrorType<unknown>;
export declare const useRenameProjectFile: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof renameProjectFile>>, TError, {
        id: string;
        data: BodyType<RenameProjectFileBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof renameProjectFile>>, TError, {
    id: string;
    data: BodyType<RenameProjectFileBody>;
}, TContext>;
export declare const getGetProjectEnvUrl: (id: string) => string;
export declare const getProjectEnv: (id: string, options?: RequestInit) => Promise<GetProjectEnv200>;
export declare const getGetProjectEnvQueryKey: (id: string) => readonly [`/api/brucepanel/projects/${string}/env`];
export declare const getGetProjectEnvQueryOptions: <TData = Awaited<ReturnType<typeof getProjectEnv>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProjectEnv>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProjectEnv>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProjectEnvQueryResult = NonNullable<Awaited<ReturnType<typeof getProjectEnv>>>;
export type GetProjectEnvQueryError = ErrorType<unknown>;
export declare function useGetProjectEnv<TData = Awaited<ReturnType<typeof getProjectEnv>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProjectEnv>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateProjectEnvUrl: (id: string) => string;
export declare const updateProjectEnv: (id: string, updateProjectEnvBody: UpdateProjectEnvBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getUpdateProjectEnvMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProjectEnv>>, TError, {
        id: string;
        data: BodyType<UpdateProjectEnvBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateProjectEnv>>, TError, {
    id: string;
    data: BodyType<UpdateProjectEnvBody>;
}, TContext>;
export type UpdateProjectEnvMutationResult = NonNullable<Awaited<ReturnType<typeof updateProjectEnv>>>;
export type UpdateProjectEnvMutationBody = BodyType<UpdateProjectEnvBody>;
export type UpdateProjectEnvMutationError = ErrorType<unknown>;
export declare const useUpdateProjectEnv: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProjectEnv>>, TError, {
        id: string;
        data: BodyType<UpdateProjectEnvBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateProjectEnv>>, TError, {
    id: string;
    data: BodyType<UpdateProjectEnvBody>;
}, TContext>;
export declare const getListCronJobsUrl: (id: string) => string;
export declare const listCronJobs: (id: string, options?: RequestInit) => Promise<CronJob[]>;
export declare const getListCronJobsQueryKey: (id: string) => readonly [`/api/brucepanel/projects/${string}/crons`];
export declare const getListCronJobsQueryOptions: <TData = Awaited<ReturnType<typeof listCronJobs>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCronJobs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCronJobs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCronJobsQueryResult = NonNullable<Awaited<ReturnType<typeof listCronJobs>>>;
export type ListCronJobsQueryError = ErrorType<unknown>;
export declare function useListCronJobs<TData = Awaited<ReturnType<typeof listCronJobs>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCronJobs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateCronJobUrl: (id: string) => string;
export declare const createCronJob: (id: string, createCronBody: CreateCronBody, options?: RequestInit) => Promise<CronJob>;
export declare const getCreateCronJobMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCronJob>>, TError, {
        id: string;
        data: BodyType<CreateCronBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createCronJob>>, TError, {
    id: string;
    data: BodyType<CreateCronBody>;
}, TContext>;
export type CreateCronJobMutationResult = NonNullable<Awaited<ReturnType<typeof createCronJob>>>;
export type CreateCronJobMutationBody = BodyType<CreateCronBody>;
export type CreateCronJobMutationError = ErrorType<unknown>;
export declare const useCreateCronJob: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCronJob>>, TError, {
        id: string;
        data: BodyType<CreateCronBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createCronJob>>, TError, {
    id: string;
    data: BodyType<CreateCronBody>;
}, TContext>;
export declare const getUpdateCronJobUrl: (id: string, cronId: string) => string;
export declare const updateCronJob: (id: string, cronId: string, createCronBody: CreateCronBody, options?: RequestInit) => Promise<CronJob>;
export declare const getUpdateCronJobMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCronJob>>, TError, {
        id: string;
        cronId: string;
        data: BodyType<CreateCronBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateCronJob>>, TError, {
    id: string;
    cronId: string;
    data: BodyType<CreateCronBody>;
}, TContext>;
export type UpdateCronJobMutationResult = NonNullable<Awaited<ReturnType<typeof updateCronJob>>>;
export type UpdateCronJobMutationBody = BodyType<CreateCronBody>;
export type UpdateCronJobMutationError = ErrorType<unknown>;
export declare const useUpdateCronJob: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCronJob>>, TError, {
        id: string;
        cronId: string;
        data: BodyType<CreateCronBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateCronJob>>, TError, {
    id: string;
    cronId: string;
    data: BodyType<CreateCronBody>;
}, TContext>;
export declare const getDeleteCronJobUrl: (id: string, cronId: string) => string;
export declare const deleteCronJob: (id: string, cronId: string, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getDeleteCronJobMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCronJob>>, TError, {
        id: string;
        cronId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteCronJob>>, TError, {
    id: string;
    cronId: string;
}, TContext>;
export type DeleteCronJobMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCronJob>>>;
export type DeleteCronJobMutationError = ErrorType<unknown>;
export declare const useDeleteCronJob: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCronJob>>, TError, {
        id: string;
        cronId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteCronJob>>, TError, {
    id: string;
    cronId: string;
}, TContext>;
export declare const getListBotsUrl: () => string;
export declare const listBots: (options?: RequestInit) => Promise<BotTemplate[]>;
export declare const getListBotsQueryKey: () => readonly ["/api/brucepanel/bots"];
export declare const getListBotsQueryOptions: <TData = Awaited<ReturnType<typeof listBots>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBots>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listBots>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListBotsQueryResult = NonNullable<Awaited<ReturnType<typeof listBots>>>;
export type ListBotsQueryError = ErrorType<unknown>;
export declare function useListBots<TData = Awaited<ReturnType<typeof listBots>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBots>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetBotCategoriesUrl: () => string;
export declare const getBotCategories: (options?: RequestInit) => Promise<BotCategory[]>;
export declare const getGetBotCategoriesQueryKey: () => readonly ["/api/brucepanel/bots/categories"];
export declare const getGetBotCategoriesQueryOptions: <TData = Awaited<ReturnType<typeof getBotCategories>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBotCategories>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBotCategories>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBotCategoriesQueryResult = NonNullable<Awaited<ReturnType<typeof getBotCategories>>>;
export type GetBotCategoriesQueryError = ErrorType<unknown>;
export declare function useGetBotCategories<TData = Awaited<ReturnType<typeof getBotCategories>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBotCategories>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetFeaturedBotsUrl: () => string;
export declare const getFeaturedBots: (options?: RequestInit) => Promise<BotTemplate[]>;
export declare const getGetFeaturedBotsQueryKey: () => readonly ["/api/brucepanel/bots/featured"];
export declare const getGetFeaturedBotsQueryOptions: <TData = Awaited<ReturnType<typeof getFeaturedBots>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFeaturedBots>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getFeaturedBots>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetFeaturedBotsQueryResult = NonNullable<Awaited<ReturnType<typeof getFeaturedBots>>>;
export type GetFeaturedBotsQueryError = ErrorType<unknown>;
export declare function useGetFeaturedBots<TData = Awaited<ReturnType<typeof getFeaturedBots>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFeaturedBots>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetBotTemplateUrl: (id: string) => string;
export declare const getBotTemplate: (id: string, options?: RequestInit) => Promise<BotTemplate>;
export declare const getGetBotTemplateQueryKey: (id: string) => readonly [`/api/brucepanel/bots/${string}`];
export declare const getGetBotTemplateQueryOptions: <TData = Awaited<ReturnType<typeof getBotTemplate>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBotTemplate>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBotTemplate>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBotTemplateQueryResult = NonNullable<Awaited<ReturnType<typeof getBotTemplate>>>;
export type GetBotTemplateQueryError = ErrorType<unknown>;
export declare function useGetBotTemplate<TData = Awaited<ReturnType<typeof getBotTemplate>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBotTemplate>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeployBotUrl: (id: string) => string;
export declare const deployBot: (id: string, deployBotBody: DeployBotBody, options?: RequestInit) => Promise<Project>;
export declare const getDeployBotMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deployBot>>, TError, {
        id: string;
        data: BodyType<DeployBotBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deployBot>>, TError, {
    id: string;
    data: BodyType<DeployBotBody>;
}, TContext>;
export type DeployBotMutationResult = NonNullable<Awaited<ReturnType<typeof deployBot>>>;
export type DeployBotMutationBody = BodyType<DeployBotBody>;
export type DeployBotMutationError = ErrorType<unknown>;
export declare const useDeployBot: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deployBot>>, TError, {
        id: string;
        data: BodyType<DeployBotBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deployBot>>, TError, {
    id: string;
    data: BodyType<DeployBotBody>;
}, TContext>;
export declare const getReviewBotUrl: (id: string) => string;
export declare const reviewBot: (id: string, reviewBotBody: ReviewBotBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getReviewBotMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof reviewBot>>, TError, {
        id: string;
        data: BodyType<ReviewBotBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof reviewBot>>, TError, {
    id: string;
    data: BodyType<ReviewBotBody>;
}, TContext>;
export type ReviewBotMutationResult = NonNullable<Awaited<ReturnType<typeof reviewBot>>>;
export type ReviewBotMutationBody = BodyType<ReviewBotBody>;
export type ReviewBotMutationError = ErrorType<unknown>;
export declare const useReviewBot: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof reviewBot>>, TError, {
        id: string;
        data: BodyType<ReviewBotBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof reviewBot>>, TError, {
    id: string;
    data: BodyType<ReviewBotBody>;
}, TContext>;
export declare const getGetBotReviewsUrl: (id: string) => string;
export declare const getBotReviews: (id: string, options?: RequestInit) => Promise<BotReview[]>;
export declare const getGetBotReviewsQueryKey: (id: string) => readonly [`/api/brucepanel/bots/${string}/reviews`];
export declare const getGetBotReviewsQueryOptions: <TData = Awaited<ReturnType<typeof getBotReviews>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBotReviews>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBotReviews>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBotReviewsQueryResult = NonNullable<Awaited<ReturnType<typeof getBotReviews>>>;
export type GetBotReviewsQueryError = ErrorType<unknown>;
export declare function useGetBotReviews<TData = Awaited<ReturnType<typeof getBotReviews>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBotReviews>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetCoinBalanceUrl: () => string;
export declare const getCoinBalance: (options?: RequestInit) => Promise<CoinBalance>;
export declare const getGetCoinBalanceQueryKey: () => readonly ["/api/brucepanel/coins/balance"];
export declare const getGetCoinBalanceQueryOptions: <TData = Awaited<ReturnType<typeof getCoinBalance>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCoinBalance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCoinBalance>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCoinBalanceQueryResult = NonNullable<Awaited<ReturnType<typeof getCoinBalance>>>;
export type GetCoinBalanceQueryError = ErrorType<unknown>;
export declare function useGetCoinBalance<TData = Awaited<ReturnType<typeof getCoinBalance>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCoinBalance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetCoinHistoryUrl: (params?: GetCoinHistoryParams) => string;
export declare const getCoinHistory: (params?: GetCoinHistoryParams, options?: RequestInit) => Promise<GetCoinHistory200>;
export declare const getGetCoinHistoryQueryKey: (params?: GetCoinHistoryParams) => readonly ["/api/brucepanel/coins/history", ...GetCoinHistoryParams[]];
export declare const getGetCoinHistoryQueryOptions: <TData = Awaited<ReturnType<typeof getCoinHistory>>, TError = ErrorType<unknown>>(params?: GetCoinHistoryParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCoinHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCoinHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCoinHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof getCoinHistory>>>;
export type GetCoinHistoryQueryError = ErrorType<unknown>;
export declare function useGetCoinHistory<TData = Awaited<ReturnType<typeof getCoinHistory>>, TError = ErrorType<unknown>>(params?: GetCoinHistoryParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCoinHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getTransferCoinsUrl: () => string;
export declare const transferCoins: (transferCoinsBody: TransferCoinsBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getTransferCoinsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof transferCoins>>, TError, {
        data: BodyType<TransferCoinsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof transferCoins>>, TError, {
    data: BodyType<TransferCoinsBody>;
}, TContext>;
export type TransferCoinsMutationResult = NonNullable<Awaited<ReturnType<typeof transferCoins>>>;
export type TransferCoinsMutationBody = BodyType<TransferCoinsBody>;
export type TransferCoinsMutationError = ErrorType<unknown>;
export declare const useTransferCoins: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof transferCoins>>, TError, {
        data: BodyType<TransferCoinsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof transferCoins>>, TError, {
    data: BodyType<TransferCoinsBody>;
}, TContext>;
export declare const getGetCoinLeaderboardUrl: () => string;
export declare const getCoinLeaderboard: (options?: RequestInit) => Promise<LeaderboardEntry[]>;
export declare const getGetCoinLeaderboardQueryKey: () => readonly ["/api/brucepanel/coins/leaderboard"];
export declare const getGetCoinLeaderboardQueryOptions: <TData = Awaited<ReturnType<typeof getCoinLeaderboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCoinLeaderboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCoinLeaderboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCoinLeaderboardQueryResult = NonNullable<Awaited<ReturnType<typeof getCoinLeaderboard>>>;
export type GetCoinLeaderboardQueryError = ErrorType<unknown>;
export declare function useGetCoinLeaderboard<TData = Awaited<ReturnType<typeof getCoinLeaderboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCoinLeaderboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetEarnOptionsUrl: () => string;
export declare const getEarnOptions: (options?: RequestInit) => Promise<EarnOption[]>;
export declare const getGetEarnOptionsQueryKey: () => readonly ["/api/brucepanel/coins/earn-options"];
export declare const getGetEarnOptionsQueryOptions: <TData = Awaited<ReturnType<typeof getEarnOptions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEarnOptions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEarnOptions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEarnOptionsQueryResult = NonNullable<Awaited<ReturnType<typeof getEarnOptions>>>;
export type GetEarnOptionsQueryError = ErrorType<unknown>;
export declare function useGetEarnOptions<TData = Awaited<ReturnType<typeof getEarnOptions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEarnOptions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetSubscriptionPlansUrl: () => string;
export declare const getSubscriptionPlans: (options?: RequestInit) => Promise<CoinPackage[]>;
export declare const getGetSubscriptionPlansQueryKey: () => readonly ["/api/brucepanel/subscribe/plans"];
export declare const getGetSubscriptionPlansQueryOptions: <TData = Awaited<ReturnType<typeof getSubscriptionPlans>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSubscriptionPlans>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSubscriptionPlans>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSubscriptionPlansQueryResult = NonNullable<Awaited<ReturnType<typeof getSubscriptionPlans>>>;
export type GetSubscriptionPlansQueryError = ErrorType<unknown>;
export declare function useGetSubscriptionPlans<TData = Awaited<ReturnType<typeof getSubscriptionPlans>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSubscriptionPlans>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getInitiatePaymentUrl: () => string;
export declare const initiatePayment: (initiatePaymentBody: InitiatePaymentBody, options?: RequestInit) => Promise<PaymentInitiateResponse>;
export declare const getInitiatePaymentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof initiatePayment>>, TError, {
        data: BodyType<InitiatePaymentBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof initiatePayment>>, TError, {
    data: BodyType<InitiatePaymentBody>;
}, TContext>;
export type InitiatePaymentMutationResult = NonNullable<Awaited<ReturnType<typeof initiatePayment>>>;
export type InitiatePaymentMutationBody = BodyType<InitiatePaymentBody>;
export type InitiatePaymentMutationError = ErrorType<unknown>;
export declare const useInitiatePayment: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof initiatePayment>>, TError, {
        data: BodyType<InitiatePaymentBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof initiatePayment>>, TError, {
    data: BodyType<InitiatePaymentBody>;
}, TContext>;
export declare const getGetPaymentStatusUrl: (checkoutRequestId: string) => string;
export declare const getPaymentStatus: (checkoutRequestId: string, options?: RequestInit) => Promise<PaymentStatus>;
export declare const getGetPaymentStatusQueryKey: (checkoutRequestId: string) => readonly [`/api/brucepanel/subscribe/status/${string}`];
export declare const getGetPaymentStatusQueryOptions: <TData = Awaited<ReturnType<typeof getPaymentStatus>>, TError = ErrorType<unknown>>(checkoutRequestId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPaymentStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPaymentStatus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPaymentStatusQueryResult = NonNullable<Awaited<ReturnType<typeof getPaymentStatus>>>;
export type GetPaymentStatusQueryError = ErrorType<unknown>;
export declare function useGetPaymentStatus<TData = Awaited<ReturnType<typeof getPaymentStatus>>, TError = ErrorType<unknown>>(checkoutRequestId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPaymentStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetPaymentHistoryUrl: () => string;
export declare const getPaymentHistory: (options?: RequestInit) => Promise<Transaction[]>;
export declare const getGetPaymentHistoryQueryKey: () => readonly ["/api/brucepanel/subscribe/history"];
export declare const getGetPaymentHistoryQueryOptions: <TData = Awaited<ReturnType<typeof getPaymentHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPaymentHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPaymentHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPaymentHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof getPaymentHistory>>>;
export type GetPaymentHistoryQueryError = ErrorType<unknown>;
export declare function useGetPaymentHistory<TData = Awaited<ReturnType<typeof getPaymentHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPaymentHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListAirdropsUrl: () => string;
export declare const listAirdrops: (options?: RequestInit) => Promise<Airdrop[]>;
export declare const getListAirdropsQueryKey: () => readonly ["/api/brucepanel/airdrops"];
export declare const getListAirdropsQueryOptions: <TData = Awaited<ReturnType<typeof listAirdrops>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAirdrops>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAirdrops>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAirdropsQueryResult = NonNullable<Awaited<ReturnType<typeof listAirdrops>>>;
export type ListAirdropsQueryError = ErrorType<unknown>;
export declare function useListAirdrops<TData = Awaited<ReturnType<typeof listAirdrops>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAirdrops>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getClaimAirdropUrl: (id: string) => string;
export declare const claimAirdrop: (id: string, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getClaimAirdropMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof claimAirdrop>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof claimAirdrop>>, TError, {
    id: string;
}, TContext>;
export type ClaimAirdropMutationResult = NonNullable<Awaited<ReturnType<typeof claimAirdrop>>>;
export type ClaimAirdropMutationError = ErrorType<unknown>;
export declare const useClaimAirdrop: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof claimAirdrop>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof claimAirdrop>>, TError, {
    id: string;
}, TContext>;
export declare const getGetAirdropHistoryUrl: () => string;
export declare const getAirdropHistory: (options?: RequestInit) => Promise<AirdropClaim[]>;
export declare const getGetAirdropHistoryQueryKey: () => readonly ["/api/brucepanel/airdrops/history"];
export declare const getGetAirdropHistoryQueryOptions: <TData = Awaited<ReturnType<typeof getAirdropHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAirdropHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAirdropHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAirdropHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof getAirdropHistory>>>;
export type GetAirdropHistoryQueryError = ErrorType<unknown>;
export declare function useGetAirdropHistory<TData = Awaited<ReturnType<typeof getAirdropHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAirdropHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetReferralInfoUrl: () => string;
export declare const getReferralInfo: (options?: RequestInit) => Promise<ReferralInfo>;
export declare const getGetReferralInfoQueryKey: () => readonly ["/api/brucepanel/referral/info"];
export declare const getGetReferralInfoQueryOptions: <TData = Awaited<ReturnType<typeof getReferralInfo>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getReferralInfo>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getReferralInfo>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetReferralInfoQueryResult = NonNullable<Awaited<ReturnType<typeof getReferralInfo>>>;
export type GetReferralInfoQueryError = ErrorType<unknown>;
export declare function useGetReferralInfo<TData = Awaited<ReturnType<typeof getReferralInfo>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getReferralInfo>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetReferralLeaderboardUrl: () => string;
export declare const getReferralLeaderboard: (options?: RequestInit) => Promise<LeaderboardEntry[]>;
export declare const getGetReferralLeaderboardQueryKey: () => readonly ["/api/brucepanel/referral/leaderboard"];
export declare const getGetReferralLeaderboardQueryOptions: <TData = Awaited<ReturnType<typeof getReferralLeaderboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getReferralLeaderboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getReferralLeaderboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetReferralLeaderboardQueryResult = NonNullable<Awaited<ReturnType<typeof getReferralLeaderboard>>>;
export type GetReferralLeaderboardQueryError = ErrorType<unknown>;
export declare function useGetReferralLeaderboard<TData = Awaited<ReturnType<typeof getReferralLeaderboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getReferralLeaderboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetStreakStatusUrl: () => string;
export declare const getStreakStatus: (options?: RequestInit) => Promise<StreakStatus>;
export declare const getGetStreakStatusQueryKey: () => readonly ["/api/brucepanel/streak/status"];
export declare const getGetStreakStatusQueryOptions: <TData = Awaited<ReturnType<typeof getStreakStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStreakStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStreakStatus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStreakStatusQueryResult = NonNullable<Awaited<ReturnType<typeof getStreakStatus>>>;
export type GetStreakStatusQueryError = ErrorType<unknown>;
export declare function useGetStreakStatus<TData = Awaited<ReturnType<typeof getStreakStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStreakStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getClaimStreakUrl: () => string;
export declare const claimStreak: (options?: RequestInit) => Promise<StreakClaimResponse>;
export declare const getClaimStreakMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof claimStreak>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof claimStreak>>, TError, void, TContext>;
export type ClaimStreakMutationResult = NonNullable<Awaited<ReturnType<typeof claimStreak>>>;
export type ClaimStreakMutationError = ErrorType<unknown>;
export declare const useClaimStreak: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof claimStreak>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof claimStreak>>, TError, void, TContext>;
export declare const getRedeemPromoCodeUrl: () => string;
export declare const redeemPromoCode: (redeemPromoCodeBody: RedeemPromoCodeBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getRedeemPromoCodeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof redeemPromoCode>>, TError, {
        data: BodyType<RedeemPromoCodeBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof redeemPromoCode>>, TError, {
    data: BodyType<RedeemPromoCodeBody>;
}, TContext>;
export type RedeemPromoCodeMutationResult = NonNullable<Awaited<ReturnType<typeof redeemPromoCode>>>;
export type RedeemPromoCodeMutationBody = BodyType<RedeemPromoCodeBody>;
export type RedeemPromoCodeMutationError = ErrorType<unknown>;
export declare const useRedeemPromoCode: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof redeemPromoCode>>, TError, {
        data: BodyType<RedeemPromoCodeBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof redeemPromoCode>>, TError, {
    data: BodyType<RedeemPromoCodeBody>;
}, TContext>;
export declare const getGetLeaderboardUrl: () => string;
export declare const getLeaderboard: (options?: RequestInit) => Promise<LeaderboardEntry[]>;
export declare const getGetLeaderboardQueryKey: () => readonly ["/api/brucepanel/leaderboard"];
export declare const getGetLeaderboardQueryOptions: <TData = Awaited<ReturnType<typeof getLeaderboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLeaderboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLeaderboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLeaderboardQueryResult = NonNullable<Awaited<ReturnType<typeof getLeaderboard>>>;
export type GetLeaderboardQueryError = ErrorType<unknown>;
export declare function useGetLeaderboard<TData = Awaited<ReturnType<typeof getLeaderboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLeaderboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListBadgesUrl: () => string;
export declare const listBadges: (options?: RequestInit) => Promise<Badge[]>;
export declare const getListBadgesQueryKey: () => readonly ["/api/brucepanel/badges"];
export declare const getListBadgesQueryOptions: <TData = Awaited<ReturnType<typeof listBadges>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBadges>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listBadges>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListBadgesQueryResult = NonNullable<Awaited<ReturnType<typeof listBadges>>>;
export type ListBadgesQueryError = ErrorType<unknown>;
export declare function useListBadges<TData = Awaited<ReturnType<typeof listBadges>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBadges>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateProfileUrl: () => string;
export declare const updateProfile: (updateProfileBody: UpdateProfileBody, options?: RequestInit) => Promise<User>;
export declare const getUpdateProfileMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProfile>>, TError, {
        data: BodyType<UpdateProfileBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateProfile>>, TError, {
    data: BodyType<UpdateProfileBody>;
}, TContext>;
export type UpdateProfileMutationResult = NonNullable<Awaited<ReturnType<typeof updateProfile>>>;
export type UpdateProfileMutationBody = BodyType<UpdateProfileBody>;
export type UpdateProfileMutationError = ErrorType<unknown>;
export declare const useUpdateProfile: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProfile>>, TError, {
        data: BodyType<UpdateProfileBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateProfile>>, TError, {
    data: BodyType<UpdateProfileBody>;
}, TContext>;
export declare const getGetAccountSessionsUrl: () => string;
export declare const getAccountSessions: (options?: RequestInit) => Promise<UserSession[]>;
export declare const getGetAccountSessionsQueryKey: () => readonly ["/api/brucepanel/account/sessions"];
export declare const getGetAccountSessionsQueryOptions: <TData = Awaited<ReturnType<typeof getAccountSessions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAccountSessions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAccountSessions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAccountSessionsQueryResult = NonNullable<Awaited<ReturnType<typeof getAccountSessions>>>;
export type GetAccountSessionsQueryError = ErrorType<unknown>;
export declare function useGetAccountSessions<TData = Awaited<ReturnType<typeof getAccountSessions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAccountSessions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetAccountActivityUrl: () => string;
export declare const getAccountActivity: (options?: RequestInit) => Promise<AuditEntry[]>;
export declare const getGetAccountActivityQueryKey: () => readonly ["/api/brucepanel/account/activity"];
export declare const getGetAccountActivityQueryOptions: <TData = Awaited<ReturnType<typeof getAccountActivity>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAccountActivity>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAccountActivity>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAccountActivityQueryResult = NonNullable<Awaited<ReturnType<typeof getAccountActivity>>>;
export type GetAccountActivityQueryError = ErrorType<unknown>;
export declare function useGetAccountActivity<TData = Awaited<ReturnType<typeof getAccountActivity>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAccountActivity>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListApiKeysUrl: () => string;
export declare const listApiKeys: (options?: RequestInit) => Promise<ApiKey[]>;
export declare const getListApiKeysQueryKey: () => readonly ["/api/brucepanel/api/keys"];
export declare const getListApiKeysQueryOptions: <TData = Awaited<ReturnType<typeof listApiKeys>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listApiKeys>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listApiKeys>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListApiKeysQueryResult = NonNullable<Awaited<ReturnType<typeof listApiKeys>>>;
export type ListApiKeysQueryError = ErrorType<unknown>;
export declare function useListApiKeys<TData = Awaited<ReturnType<typeof listApiKeys>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listApiKeys>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateApiKeyUrl: () => string;
export declare const createApiKey: (createApiKeyBody: CreateApiKeyBody, options?: RequestInit) => Promise<ApiKeyWithSecret>;
export declare const getCreateApiKeyMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createApiKey>>, TError, {
        data: BodyType<CreateApiKeyBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createApiKey>>, TError, {
    data: BodyType<CreateApiKeyBody>;
}, TContext>;
export type CreateApiKeyMutationResult = NonNullable<Awaited<ReturnType<typeof createApiKey>>>;
export type CreateApiKeyMutationBody = BodyType<CreateApiKeyBody>;
export type CreateApiKeyMutationError = ErrorType<unknown>;
export declare const useCreateApiKey: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createApiKey>>, TError, {
        data: BodyType<CreateApiKeyBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createApiKey>>, TError, {
    data: BodyType<CreateApiKeyBody>;
}, TContext>;
export declare const getDeleteApiKeyUrl: (id: string) => string;
export declare const deleteApiKey: (id: string, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getDeleteApiKeyMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteApiKey>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteApiKey>>, TError, {
    id: string;
}, TContext>;
export type DeleteApiKeyMutationResult = NonNullable<Awaited<ReturnType<typeof deleteApiKey>>>;
export type DeleteApiKeyMutationError = ErrorType<unknown>;
export declare const useDeleteApiKey: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteApiKey>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteApiKey>>, TError, {
    id: string;
}, TContext>;
export declare const getListNotificationsUrl: (params?: ListNotificationsParams) => string;
export declare const listNotifications: (params?: ListNotificationsParams, options?: RequestInit) => Promise<Notification[]>;
export declare const getListNotificationsQueryKey: (params?: ListNotificationsParams) => readonly ["/api/brucepanel/notifications", ...ListNotificationsParams[]];
export declare const getListNotificationsQueryOptions: <TData = Awaited<ReturnType<typeof listNotifications>>, TError = ErrorType<unknown>>(params?: ListNotificationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListNotificationsQueryResult = NonNullable<Awaited<ReturnType<typeof listNotifications>>>;
export type ListNotificationsQueryError = ErrorType<unknown>;
export declare function useListNotifications<TData = Awaited<ReturnType<typeof listNotifications>>, TError = ErrorType<unknown>>(params?: ListNotificationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getMarkNotificationReadUrl: (notifId: string) => string;
export declare const markNotificationRead: (notifId: string, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getMarkNotificationReadMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
        notifId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
    notifId: string;
}, TContext>;
export type MarkNotificationReadMutationResult = NonNullable<Awaited<ReturnType<typeof markNotificationRead>>>;
export type MarkNotificationReadMutationError = ErrorType<unknown>;
export declare const useMarkNotificationRead: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
        notifId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
    notifId: string;
}, TContext>;
export declare const getMarkAllNotificationsReadUrl: () => string;
export declare const markAllNotificationsRead: (options?: RequestInit) => Promise<SuccessResponse>;
export declare const getMarkAllNotificationsReadMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markAllNotificationsRead>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof markAllNotificationsRead>>, TError, void, TContext>;
export type MarkAllNotificationsReadMutationResult = NonNullable<Awaited<ReturnType<typeof markAllNotificationsRead>>>;
export type MarkAllNotificationsReadMutationError = ErrorType<unknown>;
export declare const useMarkAllNotificationsRead: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markAllNotificationsRead>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof markAllNotificationsRead>>, TError, void, TContext>;
export declare const getDeleteNotificationUrl: (notifId: string) => string;
export declare const deleteNotification: (notifId: string, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getDeleteNotificationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteNotification>>, TError, {
        notifId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteNotification>>, TError, {
    notifId: string;
}, TContext>;
export type DeleteNotificationMutationResult = NonNullable<Awaited<ReturnType<typeof deleteNotification>>>;
export type DeleteNotificationMutationError = ErrorType<unknown>;
export declare const useDeleteNotification: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteNotification>>, TError, {
        notifId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteNotification>>, TError, {
    notifId: string;
}, TContext>;
export declare const getListAnnouncementsUrl: () => string;
export declare const listAnnouncements: (options?: RequestInit) => Promise<Announcement[]>;
export declare const getListAnnouncementsQueryKey: () => readonly ["/api/brucepanel/announcements"];
export declare const getListAnnouncementsQueryOptions: <TData = Awaited<ReturnType<typeof listAnnouncements>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAnnouncements>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAnnouncements>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAnnouncementsQueryResult = NonNullable<Awaited<ReturnType<typeof listAnnouncements>>>;
export type ListAnnouncementsQueryError = ErrorType<unknown>;
export declare function useListAnnouncements<TData = Awaited<ReturnType<typeof listAnnouncements>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAnnouncements>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListSupportTicketsUrl: () => string;
export declare const listSupportTickets: (options?: RequestInit) => Promise<SupportTicket[]>;
export declare const getListSupportTicketsQueryKey: () => readonly ["/api/brucepanel/support/tickets"];
export declare const getListSupportTicketsQueryOptions: <TData = Awaited<ReturnType<typeof listSupportTickets>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSupportTickets>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSupportTickets>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSupportTicketsQueryResult = NonNullable<Awaited<ReturnType<typeof listSupportTickets>>>;
export type ListSupportTicketsQueryError = ErrorType<unknown>;
export declare function useListSupportTickets<TData = Awaited<ReturnType<typeof listSupportTickets>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSupportTickets>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateSupportTicketUrl: () => string;
export declare const createSupportTicket: (createTicketBody: CreateTicketBody, options?: RequestInit) => Promise<SupportTicket>;
export declare const getCreateSupportTicketMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSupportTicket>>, TError, {
        data: BodyType<CreateTicketBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createSupportTicket>>, TError, {
    data: BodyType<CreateTicketBody>;
}, TContext>;
export type CreateSupportTicketMutationResult = NonNullable<Awaited<ReturnType<typeof createSupportTicket>>>;
export type CreateSupportTicketMutationBody = BodyType<CreateTicketBody>;
export type CreateSupportTicketMutationError = ErrorType<unknown>;
export declare const useCreateSupportTicket: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSupportTicket>>, TError, {
        data: BodyType<CreateTicketBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createSupportTicket>>, TError, {
    data: BodyType<CreateTicketBody>;
}, TContext>;
export declare const getGetSupportTicketUrl: (ticketId: string) => string;
export declare const getSupportTicket: (ticketId: string, options?: RequestInit) => Promise<SupportTicketDetail>;
export declare const getGetSupportTicketQueryKey: (ticketId: string) => readonly [`/api/brucepanel/support/tickets/${string}`];
export declare const getGetSupportTicketQueryOptions: <TData = Awaited<ReturnType<typeof getSupportTicket>>, TError = ErrorType<unknown>>(ticketId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSupportTicket>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSupportTicket>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSupportTicketQueryResult = NonNullable<Awaited<ReturnType<typeof getSupportTicket>>>;
export type GetSupportTicketQueryError = ErrorType<unknown>;
export declare function useGetSupportTicket<TData = Awaited<ReturnType<typeof getSupportTicket>>, TError = ErrorType<unknown>>(ticketId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSupportTicket>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSendTicketMessageUrl: (ticketId: string) => string;
export declare const sendTicketMessage: (ticketId: string, sendTicketMessageBody: SendTicketMessageBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getSendTicketMessageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendTicketMessage>>, TError, {
        ticketId: string;
        data: BodyType<SendTicketMessageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendTicketMessage>>, TError, {
    ticketId: string;
    data: BodyType<SendTicketMessageBody>;
}, TContext>;
export type SendTicketMessageMutationResult = NonNullable<Awaited<ReturnType<typeof sendTicketMessage>>>;
export type SendTicketMessageMutationBody = BodyType<SendTicketMessageBody>;
export type SendTicketMessageMutationError = ErrorType<unknown>;
export declare const useSendTicketMessage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendTicketMessage>>, TError, {
        ticketId: string;
        data: BodyType<SendTicketMessageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendTicketMessage>>, TError, {
    ticketId: string;
    data: BodyType<SendTicketMessageBody>;
}, TContext>;
export declare const getGetPlatformStatusUrl: () => string;
export declare const getPlatformStatus: (options?: RequestInit) => Promise<PlatformStatus>;
export declare const getGetPlatformStatusQueryKey: () => readonly ["/api/brucepanel/status"];
export declare const getGetPlatformStatusQueryOptions: <TData = Awaited<ReturnType<typeof getPlatformStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPlatformStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPlatformStatus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPlatformStatusQueryResult = NonNullable<Awaited<ReturnType<typeof getPlatformStatus>>>;
export type GetPlatformStatusQueryError = ErrorType<unknown>;
export declare function useGetPlatformStatus<TData = Awaited<ReturnType<typeof getPlatformStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPlatformStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetAdminDashboardUrl: () => string;
export declare const getAdminDashboard: (options?: RequestInit) => Promise<AdminDashboard>;
export declare const getGetAdminDashboardQueryKey: () => readonly ["/api/brucepanel/admin/dashboard"];
export declare const getGetAdminDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getAdminDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAdminDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminDashboard>>>;
export type GetAdminDashboardQueryError = ErrorType<unknown>;
export declare function useGetAdminDashboard<TData = Awaited<ReturnType<typeof getAdminDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetSystemInfoUrl: () => string;
export declare const getSystemInfo: (options?: RequestInit) => Promise<SystemInfo>;
export declare const getGetSystemInfoQueryKey: () => readonly ["/api/brucepanel/admin/system"];
export declare const getGetSystemInfoQueryOptions: <TData = Awaited<ReturnType<typeof getSystemInfo>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSystemInfo>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSystemInfo>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSystemInfoQueryResult = NonNullable<Awaited<ReturnType<typeof getSystemInfo>>>;
export type GetSystemInfoQueryError = ErrorType<unknown>;
export declare function useGetSystemInfo<TData = Awaited<ReturnType<typeof getSystemInfo>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSystemInfo>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminListUsersUrl: (params?: AdminListUsersParams) => string;
export declare const adminListUsers: (params?: AdminListUsersParams, options?: RequestInit) => Promise<PaginatedUsers>;
export declare const getAdminListUsersQueryKey: (params?: AdminListUsersParams) => readonly ["/api/brucepanel/admin/users", ...AdminListUsersParams[]];
export declare const getAdminListUsersQueryOptions: <TData = Awaited<ReturnType<typeof adminListUsers>>, TError = ErrorType<unknown>>(params?: AdminListUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminListUsers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminListUsersQueryResult = NonNullable<Awaited<ReturnType<typeof adminListUsers>>>;
export type AdminListUsersQueryError = ErrorType<unknown>;
export declare function useAdminListUsers<TData = Awaited<ReturnType<typeof adminListUsers>>, TError = ErrorType<unknown>>(params?: AdminListUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminGetUserUrl: (userId: string) => string;
export declare const adminGetUser: (userId: string, options?: RequestInit) => Promise<AdminUserDetail>;
export declare const getAdminGetUserQueryKey: (userId: string) => readonly [`/api/brucepanel/admin/users/${string}`];
export declare const getAdminGetUserQueryOptions: <TData = Awaited<ReturnType<typeof adminGetUser>>, TError = ErrorType<unknown>>(userId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminGetUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminGetUser>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminGetUserQueryResult = NonNullable<Awaited<ReturnType<typeof adminGetUser>>>;
export type AdminGetUserQueryError = ErrorType<unknown>;
export declare function useAdminGetUser<TData = Awaited<ReturnType<typeof adminGetUser>>, TError = ErrorType<unknown>>(userId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminGetUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminDeleteUserUrl: (userId: string) => string;
export declare const adminDeleteUser: (userId: string, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getAdminDeleteUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminDeleteUser>>, TError, {
        userId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminDeleteUser>>, TError, {
    userId: string;
}, TContext>;
export type AdminDeleteUserMutationResult = NonNullable<Awaited<ReturnType<typeof adminDeleteUser>>>;
export type AdminDeleteUserMutationError = ErrorType<unknown>;
export declare const useAdminDeleteUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminDeleteUser>>, TError, {
        userId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminDeleteUser>>, TError, {
    userId: string;
}, TContext>;
export declare const getAdminAdjustCoinsUrl: (userId: string) => string;
export declare const adminAdjustCoins: (userId: string, adminAdjustCoinsBody: AdminAdjustCoinsBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getAdminAdjustCoinsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminAdjustCoins>>, TError, {
        userId: string;
        data: BodyType<AdminAdjustCoinsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminAdjustCoins>>, TError, {
    userId: string;
    data: BodyType<AdminAdjustCoinsBody>;
}, TContext>;
export type AdminAdjustCoinsMutationResult = NonNullable<Awaited<ReturnType<typeof adminAdjustCoins>>>;
export type AdminAdjustCoinsMutationBody = BodyType<AdminAdjustCoinsBody>;
export type AdminAdjustCoinsMutationError = ErrorType<unknown>;
export declare const useAdminAdjustCoins: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminAdjustCoins>>, TError, {
        userId: string;
        data: BodyType<AdminAdjustCoinsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminAdjustCoins>>, TError, {
    userId: string;
    data: BodyType<AdminAdjustCoinsBody>;
}, TContext>;
export declare const getAdminBanUserUrl: (userId: string) => string;
export declare const adminBanUser: (userId: string, adminBanUserBody: AdminBanUserBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getAdminBanUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminBanUser>>, TError, {
        userId: string;
        data: BodyType<AdminBanUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminBanUser>>, TError, {
    userId: string;
    data: BodyType<AdminBanUserBody>;
}, TContext>;
export type AdminBanUserMutationResult = NonNullable<Awaited<ReturnType<typeof adminBanUser>>>;
export type AdminBanUserMutationBody = BodyType<AdminBanUserBody>;
export type AdminBanUserMutationError = ErrorType<unknown>;
export declare const useAdminBanUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminBanUser>>, TError, {
        userId: string;
        data: BodyType<AdminBanUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminBanUser>>, TError, {
    userId: string;
    data: BodyType<AdminBanUserBody>;
}, TContext>;
export declare const getAdminSetRoleUrl: (userId: string) => string;
export declare const adminSetRole: (userId: string, adminSetRoleBody: AdminSetRoleBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getAdminSetRoleMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminSetRole>>, TError, {
        userId: string;
        data: BodyType<AdminSetRoleBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminSetRole>>, TError, {
    userId: string;
    data: BodyType<AdminSetRoleBody>;
}, TContext>;
export type AdminSetRoleMutationResult = NonNullable<Awaited<ReturnType<typeof adminSetRole>>>;
export type AdminSetRoleMutationBody = BodyType<AdminSetRoleBody>;
export type AdminSetRoleMutationError = ErrorType<unknown>;
export declare const useAdminSetRole: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminSetRole>>, TError, {
        userId: string;
        data: BodyType<AdminSetRoleBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminSetRole>>, TError, {
    userId: string;
    data: BodyType<AdminSetRoleBody>;
}, TContext>;
export declare const getAdminListProjectsUrl: (params?: AdminListProjectsParams) => string;
export declare const adminListProjects: (params?: AdminListProjectsParams, options?: RequestInit) => Promise<PaginatedProjects>;
export declare const getAdminListProjectsQueryKey: (params?: AdminListProjectsParams) => readonly ["/api/brucepanel/admin/projects", ...AdminListProjectsParams[]];
export declare const getAdminListProjectsQueryOptions: <TData = Awaited<ReturnType<typeof adminListProjects>>, TError = ErrorType<unknown>>(params?: AdminListProjectsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListProjects>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminListProjects>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminListProjectsQueryResult = NonNullable<Awaited<ReturnType<typeof adminListProjects>>>;
export type AdminListProjectsQueryError = ErrorType<unknown>;
export declare function useAdminListProjects<TData = Awaited<ReturnType<typeof adminListProjects>>, TError = ErrorType<unknown>>(params?: AdminListProjectsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListProjects>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetEconomyOverviewUrl: () => string;
export declare const getEconomyOverview: (options?: RequestInit) => Promise<EconomyOverview>;
export declare const getGetEconomyOverviewQueryKey: () => readonly ["/api/brucepanel/admin/economy/overview"];
export declare const getGetEconomyOverviewQueryOptions: <TData = Awaited<ReturnType<typeof getEconomyOverview>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEconomyOverview>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEconomyOverview>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEconomyOverviewQueryResult = NonNullable<Awaited<ReturnType<typeof getEconomyOverview>>>;
export type GetEconomyOverviewQueryError = ErrorType<unknown>;
export declare function useGetEconomyOverview<TData = Awaited<ReturnType<typeof getEconomyOverview>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEconomyOverview>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminListTransactionsUrl: (params?: AdminListTransactionsParams) => string;
export declare const adminListTransactions: (params?: AdminListTransactionsParams, options?: RequestInit) => Promise<PaginatedTransactions>;
export declare const getAdminListTransactionsQueryKey: (params?: AdminListTransactionsParams) => readonly ["/api/brucepanel/admin/transactions", ...AdminListTransactionsParams[]];
export declare const getAdminListTransactionsQueryOptions: <TData = Awaited<ReturnType<typeof adminListTransactions>>, TError = ErrorType<unknown>>(params?: AdminListTransactionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminListTransactions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminListTransactionsQueryResult = NonNullable<Awaited<ReturnType<typeof adminListTransactions>>>;
export type AdminListTransactionsQueryError = ErrorType<unknown>;
export declare function useAdminListTransactions<TData = Awaited<ReturnType<typeof adminListTransactions>>, TError = ErrorType<unknown>>(params?: AdminListTransactionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminListCoinPackagesUrl: () => string;
export declare const adminListCoinPackages: (options?: RequestInit) => Promise<CoinPackage[]>;
export declare const getAdminListCoinPackagesQueryKey: () => readonly ["/api/brucepanel/admin/coin-packages"];
export declare const getAdminListCoinPackagesQueryOptions: <TData = Awaited<ReturnType<typeof adminListCoinPackages>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListCoinPackages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminListCoinPackages>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminListCoinPackagesQueryResult = NonNullable<Awaited<ReturnType<typeof adminListCoinPackages>>>;
export type AdminListCoinPackagesQueryError = ErrorType<unknown>;
export declare function useAdminListCoinPackages<TData = Awaited<ReturnType<typeof adminListCoinPackages>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListCoinPackages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminCreateCoinPackageUrl: () => string;
export declare const adminCreateCoinPackage: (createCoinPackageBody: CreateCoinPackageBody, options?: RequestInit) => Promise<CoinPackage>;
export declare const getAdminCreateCoinPackageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminCreateCoinPackage>>, TError, {
        data: BodyType<CreateCoinPackageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminCreateCoinPackage>>, TError, {
    data: BodyType<CreateCoinPackageBody>;
}, TContext>;
export type AdminCreateCoinPackageMutationResult = NonNullable<Awaited<ReturnType<typeof adminCreateCoinPackage>>>;
export type AdminCreateCoinPackageMutationBody = BodyType<CreateCoinPackageBody>;
export type AdminCreateCoinPackageMutationError = ErrorType<unknown>;
export declare const useAdminCreateCoinPackage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminCreateCoinPackage>>, TError, {
        data: BodyType<CreateCoinPackageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminCreateCoinPackage>>, TError, {
    data: BodyType<CreateCoinPackageBody>;
}, TContext>;
export declare const getAdminUpdateCoinPackageUrl: (pkgId: string) => string;
export declare const adminUpdateCoinPackage: (pkgId: string, createCoinPackageBody: CreateCoinPackageBody, options?: RequestInit) => Promise<CoinPackage>;
export declare const getAdminUpdateCoinPackageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminUpdateCoinPackage>>, TError, {
        pkgId: string;
        data: BodyType<CreateCoinPackageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminUpdateCoinPackage>>, TError, {
    pkgId: string;
    data: BodyType<CreateCoinPackageBody>;
}, TContext>;
export type AdminUpdateCoinPackageMutationResult = NonNullable<Awaited<ReturnType<typeof adminUpdateCoinPackage>>>;
export type AdminUpdateCoinPackageMutationBody = BodyType<CreateCoinPackageBody>;
export type AdminUpdateCoinPackageMutationError = ErrorType<unknown>;
export declare const useAdminUpdateCoinPackage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminUpdateCoinPackage>>, TError, {
        pkgId: string;
        data: BodyType<CreateCoinPackageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminUpdateCoinPackage>>, TError, {
    pkgId: string;
    data: BodyType<CreateCoinPackageBody>;
}, TContext>;
export declare const getAdminDeleteCoinPackageUrl: (pkgId: string) => string;
export declare const adminDeleteCoinPackage: (pkgId: string, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getAdminDeleteCoinPackageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminDeleteCoinPackage>>, TError, {
        pkgId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminDeleteCoinPackage>>, TError, {
    pkgId: string;
}, TContext>;
export type AdminDeleteCoinPackageMutationResult = NonNullable<Awaited<ReturnType<typeof adminDeleteCoinPackage>>>;
export type AdminDeleteCoinPackageMutationError = ErrorType<unknown>;
export declare const useAdminDeleteCoinPackage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminDeleteCoinPackage>>, TError, {
        pkgId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminDeleteCoinPackage>>, TError, {
    pkgId: string;
}, TContext>;
export declare const getAdminListAirdropsUrl: () => string;
export declare const adminListAirdrops: (options?: RequestInit) => Promise<Airdrop[]>;
export declare const getAdminListAirdropsQueryKey: () => readonly ["/api/brucepanel/admin/airdrops"];
export declare const getAdminListAirdropsQueryOptions: <TData = Awaited<ReturnType<typeof adminListAirdrops>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListAirdrops>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminListAirdrops>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminListAirdropsQueryResult = NonNullable<Awaited<ReturnType<typeof adminListAirdrops>>>;
export type AdminListAirdropsQueryError = ErrorType<unknown>;
export declare function useAdminListAirdrops<TData = Awaited<ReturnType<typeof adminListAirdrops>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListAirdrops>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminCreateAirdropUrl: () => string;
export declare const adminCreateAirdrop: (createAirdropBody: CreateAirdropBody, options?: RequestInit) => Promise<Airdrop>;
export declare const getAdminCreateAirdropMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminCreateAirdrop>>, TError, {
        data: BodyType<CreateAirdropBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminCreateAirdrop>>, TError, {
    data: BodyType<CreateAirdropBody>;
}, TContext>;
export type AdminCreateAirdropMutationResult = NonNullable<Awaited<ReturnType<typeof adminCreateAirdrop>>>;
export type AdminCreateAirdropMutationBody = BodyType<CreateAirdropBody>;
export type AdminCreateAirdropMutationError = ErrorType<unknown>;
export declare const useAdminCreateAirdrop: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminCreateAirdrop>>, TError, {
        data: BodyType<CreateAirdropBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminCreateAirdrop>>, TError, {
    data: BodyType<CreateAirdropBody>;
}, TContext>;
export declare const getAdminListBotsUrl: () => string;
export declare const adminListBots: (options?: RequestInit) => Promise<BotTemplate[]>;
export declare const getAdminListBotsQueryKey: () => readonly ["/api/brucepanel/admin/bots"];
export declare const getAdminListBotsQueryOptions: <TData = Awaited<ReturnType<typeof adminListBots>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListBots>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminListBots>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminListBotsQueryResult = NonNullable<Awaited<ReturnType<typeof adminListBots>>>;
export type AdminListBotsQueryError = ErrorType<unknown>;
export declare function useAdminListBots<TData = Awaited<ReturnType<typeof adminListBots>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListBots>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminCreateBotUrl: () => string;
export declare const adminCreateBot: (createBotBody: CreateBotBody, options?: RequestInit) => Promise<BotTemplate>;
export declare const getAdminCreateBotMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminCreateBot>>, TError, {
        data: BodyType<CreateBotBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminCreateBot>>, TError, {
    data: BodyType<CreateBotBody>;
}, TContext>;
export type AdminCreateBotMutationResult = NonNullable<Awaited<ReturnType<typeof adminCreateBot>>>;
export type AdminCreateBotMutationBody = BodyType<CreateBotBody>;
export type AdminCreateBotMutationError = ErrorType<unknown>;
export declare const useAdminCreateBot: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminCreateBot>>, TError, {
        data: BodyType<CreateBotBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminCreateBot>>, TError, {
    data: BodyType<CreateBotBody>;
}, TContext>;
export declare const getAdminUpdateBotUrl: (botId: string) => string;
export declare const adminUpdateBot: (botId: string, createBotBody: CreateBotBody, options?: RequestInit) => Promise<BotTemplate>;
export declare const getAdminUpdateBotMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminUpdateBot>>, TError, {
        botId: string;
        data: BodyType<CreateBotBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminUpdateBot>>, TError, {
    botId: string;
    data: BodyType<CreateBotBody>;
}, TContext>;
export type AdminUpdateBotMutationResult = NonNullable<Awaited<ReturnType<typeof adminUpdateBot>>>;
export type AdminUpdateBotMutationBody = BodyType<CreateBotBody>;
export type AdminUpdateBotMutationError = ErrorType<unknown>;
export declare const useAdminUpdateBot: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminUpdateBot>>, TError, {
        botId: string;
        data: BodyType<CreateBotBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminUpdateBot>>, TError, {
    botId: string;
    data: BodyType<CreateBotBody>;
}, TContext>;
export declare const getAdminDeleteBotUrl: (botId: string) => string;
export declare const adminDeleteBot: (botId: string, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getAdminDeleteBotMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminDeleteBot>>, TError, {
        botId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminDeleteBot>>, TError, {
    botId: string;
}, TContext>;
export type AdminDeleteBotMutationResult = NonNullable<Awaited<ReturnType<typeof adminDeleteBot>>>;
export type AdminDeleteBotMutationError = ErrorType<unknown>;
export declare const useAdminDeleteBot: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminDeleteBot>>, TError, {
        botId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminDeleteBot>>, TError, {
    botId: string;
}, TContext>;
export declare const getAdminListPromoCodesUrl: () => string;
export declare const adminListPromoCodes: (options?: RequestInit) => Promise<PromoCode[]>;
export declare const getAdminListPromoCodesQueryKey: () => readonly ["/api/brucepanel/admin/promo"];
export declare const getAdminListPromoCodesQueryOptions: <TData = Awaited<ReturnType<typeof adminListPromoCodes>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListPromoCodes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminListPromoCodes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminListPromoCodesQueryResult = NonNullable<Awaited<ReturnType<typeof adminListPromoCodes>>>;
export type AdminListPromoCodesQueryError = ErrorType<unknown>;
export declare function useAdminListPromoCodes<TData = Awaited<ReturnType<typeof adminListPromoCodes>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListPromoCodes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminCreatePromoCodeUrl: () => string;
export declare const adminCreatePromoCode: (createPromoCodeBody: CreatePromoCodeBody, options?: RequestInit) => Promise<PromoCode>;
export declare const getAdminCreatePromoCodeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminCreatePromoCode>>, TError, {
        data: BodyType<CreatePromoCodeBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminCreatePromoCode>>, TError, {
    data: BodyType<CreatePromoCodeBody>;
}, TContext>;
export type AdminCreatePromoCodeMutationResult = NonNullable<Awaited<ReturnType<typeof adminCreatePromoCode>>>;
export type AdminCreatePromoCodeMutationBody = BodyType<CreatePromoCodeBody>;
export type AdminCreatePromoCodeMutationError = ErrorType<unknown>;
export declare const useAdminCreatePromoCode: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminCreatePromoCode>>, TError, {
        data: BodyType<CreatePromoCodeBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminCreatePromoCode>>, TError, {
    data: BodyType<CreatePromoCodeBody>;
}, TContext>;
export declare const getAdminDeletePromoCodeUrl: (code: string) => string;
export declare const adminDeletePromoCode: (code: string, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getAdminDeletePromoCodeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminDeletePromoCode>>, TError, {
        code: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminDeletePromoCode>>, TError, {
    code: string;
}, TContext>;
export type AdminDeletePromoCodeMutationResult = NonNullable<Awaited<ReturnType<typeof adminDeletePromoCode>>>;
export type AdminDeletePromoCodeMutationError = ErrorType<unknown>;
export declare const useAdminDeletePromoCode: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminDeletePromoCode>>, TError, {
        code: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminDeletePromoCode>>, TError, {
    code: string;
}, TContext>;
export declare const getAdminListTicketsUrl: (params?: AdminListTicketsParams) => string;
export declare const adminListTickets: (params?: AdminListTicketsParams, options?: RequestInit) => Promise<SupportTicket[]>;
export declare const getAdminListTicketsQueryKey: (params?: AdminListTicketsParams) => readonly ["/api/brucepanel/admin/support/tickets", ...AdminListTicketsParams[]];
export declare const getAdminListTicketsQueryOptions: <TData = Awaited<ReturnType<typeof adminListTickets>>, TError = ErrorType<unknown>>(params?: AdminListTicketsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListTickets>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminListTickets>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminListTicketsQueryResult = NonNullable<Awaited<ReturnType<typeof adminListTickets>>>;
export type AdminListTicketsQueryError = ErrorType<unknown>;
export declare function useAdminListTickets<TData = Awaited<ReturnType<typeof adminListTickets>>, TError = ErrorType<unknown>>(params?: AdminListTicketsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListTickets>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminListAnnouncementsUrl: () => string;
export declare const adminListAnnouncements: (options?: RequestInit) => Promise<Announcement[]>;
export declare const getAdminListAnnouncementsQueryKey: () => readonly ["/api/brucepanel/admin/announcements"];
export declare const getAdminListAnnouncementsQueryOptions: <TData = Awaited<ReturnType<typeof adminListAnnouncements>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListAnnouncements>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminListAnnouncements>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminListAnnouncementsQueryResult = NonNullable<Awaited<ReturnType<typeof adminListAnnouncements>>>;
export type AdminListAnnouncementsQueryError = ErrorType<unknown>;
export declare function useAdminListAnnouncements<TData = Awaited<ReturnType<typeof adminListAnnouncements>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListAnnouncements>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminCreateAnnouncementUrl: () => string;
export declare const adminCreateAnnouncement: (createAnnouncementBody: CreateAnnouncementBody, options?: RequestInit) => Promise<Announcement>;
export declare const getAdminCreateAnnouncementMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminCreateAnnouncement>>, TError, {
        data: BodyType<CreateAnnouncementBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminCreateAnnouncement>>, TError, {
    data: BodyType<CreateAnnouncementBody>;
}, TContext>;
export type AdminCreateAnnouncementMutationResult = NonNullable<Awaited<ReturnType<typeof adminCreateAnnouncement>>>;
export type AdminCreateAnnouncementMutationBody = BodyType<CreateAnnouncementBody>;
export type AdminCreateAnnouncementMutationError = ErrorType<unknown>;
export declare const useAdminCreateAnnouncement: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminCreateAnnouncement>>, TError, {
        data: BodyType<CreateAnnouncementBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminCreateAnnouncement>>, TError, {
    data: BodyType<CreateAnnouncementBody>;
}, TContext>;
export declare const getGetPlatformSettingsUrl: () => string;
export declare const getPlatformSettings: (options?: RequestInit) => Promise<PlatformSettings>;
export declare const getGetPlatformSettingsQueryKey: () => readonly ["/api/brucepanel/admin/platform"];
export declare const getGetPlatformSettingsQueryOptions: <TData = Awaited<ReturnType<typeof getPlatformSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPlatformSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPlatformSettings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPlatformSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getPlatformSettings>>>;
export type GetPlatformSettingsQueryError = ErrorType<unknown>;
export declare function useGetPlatformSettings<TData = Awaited<ReturnType<typeof getPlatformSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPlatformSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdatePlatformSettingsUrl: () => string;
export declare const updatePlatformSettings: (updatePlatformSettingsBody: UpdatePlatformSettingsBody, options?: RequestInit) => Promise<PlatformSettings>;
export declare const getUpdatePlatformSettingsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePlatformSettings>>, TError, {
        data: BodyType<UpdatePlatformSettingsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updatePlatformSettings>>, TError, {
    data: BodyType<UpdatePlatformSettingsBody>;
}, TContext>;
export type UpdatePlatformSettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updatePlatformSettings>>>;
export type UpdatePlatformSettingsMutationBody = BodyType<UpdatePlatformSettingsBody>;
export type UpdatePlatformSettingsMutationError = ErrorType<unknown>;
export declare const useUpdatePlatformSettings: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePlatformSettings>>, TError, {
        data: BodyType<UpdatePlatformSettingsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updatePlatformSettings>>, TError, {
    data: BodyType<UpdatePlatformSettingsBody>;
}, TContext>;
export declare const getGetAdminAnalyticsUrl: () => string;
export declare const getAdminAnalytics: (options?: RequestInit) => Promise<AnalyticsData>;
export declare const getGetAdminAnalyticsQueryKey: () => readonly ["/api/brucepanel/admin/analytics"];
export declare const getGetAdminAnalyticsQueryOptions: <TData = Awaited<ReturnType<typeof getAdminAnalytics>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminAnalytics>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminAnalytics>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAdminAnalyticsQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminAnalytics>>>;
export type GetAdminAnalyticsQueryError = ErrorType<unknown>;
export declare function useGetAdminAnalytics<TData = Awaited<ReturnType<typeof getAdminAnalytics>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminAnalytics>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetAuditLogUrl: (params?: GetAuditLogParams) => string;
export declare const getAuditLog: (params?: GetAuditLogParams, options?: RequestInit) => Promise<AuditEntry[]>;
export declare const getGetAuditLogQueryKey: (params?: GetAuditLogParams) => readonly ["/api/brucepanel/admin/audit", ...GetAuditLogParams[]];
export declare const getGetAuditLogQueryOptions: <TData = Awaited<ReturnType<typeof getAuditLog>>, TError = ErrorType<unknown>>(params?: GetAuditLogParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAuditLog>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAuditLog>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAuditLogQueryResult = NonNullable<Awaited<ReturnType<typeof getAuditLog>>>;
export type GetAuditLogQueryError = ErrorType<unknown>;
export declare function useGetAuditLog<TData = Awaited<ReturnType<typeof getAuditLog>>, TError = ErrorType<unknown>>(params?: GetAuditLogParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAuditLog>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminBulkCoinsUrl: () => string;
export declare const adminBulkCoins: (adminBulkCoinsBody: AdminBulkCoinsBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getAdminBulkCoinsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminBulkCoins>>, TError, {
        data: BodyType<AdminBulkCoinsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminBulkCoins>>, TError, {
    data: BodyType<AdminBulkCoinsBody>;
}, TContext>;
export type AdminBulkCoinsMutationResult = NonNullable<Awaited<ReturnType<typeof adminBulkCoins>>>;
export type AdminBulkCoinsMutationBody = BodyType<AdminBulkCoinsBody>;
export type AdminBulkCoinsMutationError = ErrorType<unknown>;
export declare const useAdminBulkCoins: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminBulkCoins>>, TError, {
        data: BodyType<AdminBulkCoinsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminBulkCoins>>, TError, {
    data: BodyType<AdminBulkCoinsBody>;
}, TContext>;
export declare const getAdminSendNotificationUrl: () => string;
export declare const adminSendNotification: (adminSendNotificationBody: AdminSendNotificationBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getAdminSendNotificationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminSendNotification>>, TError, {
        data: BodyType<AdminSendNotificationBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminSendNotification>>, TError, {
    data: BodyType<AdminSendNotificationBody>;
}, TContext>;
export type AdminSendNotificationMutationResult = NonNullable<Awaited<ReturnType<typeof adminSendNotification>>>;
export type AdminSendNotificationMutationBody = BodyType<AdminSendNotificationBody>;
export type AdminSendNotificationMutationError = ErrorType<unknown>;
export declare const useAdminSendNotification: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminSendNotification>>, TError, {
        data: BodyType<AdminSendNotificationBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminSendNotification>>, TError, {
    data: BodyType<AdminSendNotificationBody>;
}, TContext>;
export declare const getUpdateReferralConfigUrl: () => string;
export declare const updateReferralConfig: (updateReferralConfigBody: UpdateReferralConfigBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getUpdateReferralConfigMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateReferralConfig>>, TError, {
        data: BodyType<UpdateReferralConfigBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateReferralConfig>>, TError, {
    data: BodyType<UpdateReferralConfigBody>;
}, TContext>;
export type UpdateReferralConfigMutationResult = NonNullable<Awaited<ReturnType<typeof updateReferralConfig>>>;
export type UpdateReferralConfigMutationBody = BodyType<UpdateReferralConfigBody>;
export type UpdateReferralConfigMutationError = ErrorType<unknown>;
export declare const useUpdateReferralConfig: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateReferralConfig>>, TError, {
        data: BodyType<UpdateReferralConfigBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateReferralConfig>>, TError, {
    data: BodyType<UpdateReferralConfigBody>;
}, TContext>;
export declare const getEmergencyStopAllUrl: () => string;
export declare const emergencyStopAll: (options?: RequestInit) => Promise<SuccessResponse>;
export declare const getEmergencyStopAllMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof emergencyStopAll>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof emergencyStopAll>>, TError, void, TContext>;
export type EmergencyStopAllMutationResult = NonNullable<Awaited<ReturnType<typeof emergencyStopAll>>>;
export type EmergencyStopAllMutationError = ErrorType<unknown>;
export declare const useEmergencyStopAll: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof emergencyStopAll>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof emergencyStopAll>>, TError, void, TContext>;
export declare const getEmergencyRestartAllUrl: () => string;
export declare const emergencyRestartAll: (options?: RequestInit) => Promise<SuccessResponse>;
export declare const getEmergencyRestartAllMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof emergencyRestartAll>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof emergencyRestartAll>>, TError, void, TContext>;
export type EmergencyRestartAllMutationResult = NonNullable<Awaited<ReturnType<typeof emergencyRestartAll>>>;
export type EmergencyRestartAllMutationError = ErrorType<unknown>;
export declare const useEmergencyRestartAll: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof emergencyRestartAll>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof emergencyRestartAll>>, TError, void, TContext>;
export declare const getEmergencyBroadcastUrl: () => string;
export declare const emergencyBroadcast: (emergencyBroadcastBody: EmergencyBroadcastBody, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getEmergencyBroadcastMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof emergencyBroadcast>>, TError, {
        data: BodyType<EmergencyBroadcastBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof emergencyBroadcast>>, TError, {
    data: BodyType<EmergencyBroadcastBody>;
}, TContext>;
export type EmergencyBroadcastMutationResult = NonNullable<Awaited<ReturnType<typeof emergencyBroadcast>>>;
export type EmergencyBroadcastMutationBody = BodyType<EmergencyBroadcastBody>;
export type EmergencyBroadcastMutationError = ErrorType<unknown>;
export declare const useEmergencyBroadcast: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof emergencyBroadcast>>, TError, {
        data: BodyType<EmergencyBroadcastBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof emergencyBroadcast>>, TError, {
    data: BodyType<EmergencyBroadcastBody>;
}, TContext>;
export declare const getListTemplatesUrl: () => string;
export declare const listTemplates: (options?: RequestInit) => Promise<Template[]>;
export declare const getListTemplatesQueryKey: () => readonly ["/api/brucepanel/templates"];
export declare const getListTemplatesQueryOptions: <TData = Awaited<ReturnType<typeof listTemplates>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTemplates>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTemplates>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTemplatesQueryResult = NonNullable<Awaited<ReturnType<typeof listTemplates>>>;
export type ListTemplatesQueryError = ErrorType<unknown>;
export declare function useListTemplates<TData = Awaited<ReturnType<typeof listTemplates>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTemplates>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map