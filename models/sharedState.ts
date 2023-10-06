// sharedState.ts

export interface SharedState {
    jwtPayload: any | null; 
}

export const sharedState: SharedState = {
    jwtPayload: null, // Initialize jwtPayload to null
};