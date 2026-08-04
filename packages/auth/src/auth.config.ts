import { registerAs } from "@nestjs/config";


export type AuthConfig = {
    googleClient: string;
    googleSecret: string;
    hostUrl: string;
    
}


export default registerAs('auth', ():AuthConfig => {
    
    return {
        googleClient: process.env.GOOGLE_SSO_CLIENT_ID,
        googleSecret: process.env.GOOGLE_SSO_CLIENT_SECRET,
        hostUrl: process.env.HOST_URL
    }
})