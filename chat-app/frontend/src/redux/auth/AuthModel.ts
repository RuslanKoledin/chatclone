import {UUID} from "node:crypto";

export interface SignUpRequestDTO {
    email: string,
    password: string,
    fullName: string,
}

export interface UpdateUserRequestDTO {
    email?: string,
    password?: string,
    fullName: string,
    profilePhoto?: string,
    userStatus?: string,
}

export interface LoginResponseDTO {
    token: string,
    isAuthenticated: boolean,
}

export interface LoginRequestDTO {
    username: string,
    password: string,
}

export interface UserDTO {
    id: UUID,
    username: string,
    email?: string,
    fullName: string,
    lastSeen?: string,
    isOnline?: boolean,
    pinnedChatIds?: string[],
    mutedChatIds?: string[],
    profilePhoto?: string,
    userStatus?: string,
}

export interface AuthenticationErrorDTO {
    details: string,
    message: string,
}

export interface ApiResponseDTO {
    message: string,
    status: boolean,
}

export type AuthReducerState = {
    signin: LoginResponseDTO | null,
    signup: LoginResponseDTO | null,
    reqUser: UserDTO | null,
    searchUser: UserDTO[] | null,
    updateUser: ApiResponseDTO | null,
    loading: boolean,
    error: string | null,
}