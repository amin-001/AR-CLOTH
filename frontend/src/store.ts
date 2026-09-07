import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';


export interface UserDetails {
    id: string;
    role: string;
    email: string;
}

export interface TokenStore {
    token: string;
    user: UserDetails | null;
    setToken: (data: string) => void;
    setUser: (user: UserDetails | null) => void;
}


const useTokenStore = create<TokenStore>()(
    devtools(
        persist(
            (set) => ({
                token: '',
                user: null,
                setToken: (data: string) => set(() => ({ token: data })),
                setUser: (user: UserDetails | null) => set(() => ({ user })),
            }),
            { name: 'token-store' }
        )
    )
);

export default useTokenStore;
