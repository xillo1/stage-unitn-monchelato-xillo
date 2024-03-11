import mongoose, { Schema, Document } from 'mongoose';

interface jwtID_issSub_Saml_Subjects extends Document {
    format: string;
    iss: string;
    id: string,
}

const userSchema2 = new Schema<jwtID_issSub_Saml_Subjects>({
    format: String,
    iss: String,
    id: String,  
});

const UserModel2 = mongoose.model<jwtID_issSub_Saml_Subjects>('User2', userSchema2);

export default UserModel2;