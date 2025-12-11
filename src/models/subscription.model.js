import mongoose, {schema} from "mongoose"

const subscriptionSchema = new Schema({
    subscriber: {
        type: schema.Types.ObjectId, 
        ref: "User"
    },
    channel: {
        type : schema.Types.ObjectId,
        ref : "User"
    }
},{timestamps: true})

export const subscription = mongoose.model("Subscription",subscriptionSchema)