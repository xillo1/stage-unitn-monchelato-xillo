import mongoose, { Schema, Document } from 'mongoose';

interface Simple_Subject extends Document {
  format: string;
  id: string;
}

const userSchema = new Schema<Simple_Subject>({
  format: String,
  id: String,
});

const UserModel = mongoose.model<Simple_Subject>('User', userSchema);

export default UserModel;

