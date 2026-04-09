import jwt from "jsonwebtoken"

export class jwtService {
    private jwtSecretKey = process.env.CLERK_SECRET_KEY || '';

    private verifySecret(): boolean {
        if (!this.jwtSecretKey) {
            console.error('❌ [CLERK] CLERK_SECRET_KEY no está configurada');
            return false;
        }
        return true
    }

    public decodeData<T>(data: string) {
        if(!this.verifySecret()) {
            return null
        }
        const decoded = jwt.verify(data, this.jwtSecretKey) as T
        return decoded
    }

    public encodeData(data: object) {
        if (!this.verifySecret()){
            return null
        }
        const encoded = jwt.sign(data, this.jwtSecretKey, {
            noTimestamp: true
        })
        return encoded
    }
}