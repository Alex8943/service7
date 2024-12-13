import express from "express";
import { Review as Reviews, User, Media, Genre, ReviewGenres } from "../other_services/model/seqModel";
import { publishToQueue } from "../other_services/rabbitMQ";
import verifyUser from "./authenticateUser";

const router = express.Router();


// Delete review endpoint
router.put("/delete/review/:id", verifyUser, async (req, res) => {
    try {
        const result = await deleteReview(req.params.id); // Pass only the ID
        console.log("Deleting review with ID: ", req.params.id);

        res.status(200).send(result);
    } catch (error) {
        console.error("Error deleting review: ", error);
        res.status(500).send("Something went wrong with deleting the review.");
    }
});


export async function deleteReview(id: any) {
    try {
        // Step 1: Check if the review exists
        const review = await Reviews.findByPk(id);
        if (!review) {
            console.log("Review does not exist");
            return { message: "Review does not exist" };
        }else if(review.isBlocked === true){
            console.log("Review is already soft deleted");
            return { message: "Review is already soft deleted" };
        }


        console.log("Review exists:", review);

        // Step 2: Update the review's `isBlocked` field to `true`
        await Reviews.update(
            { isBlocked: true },
            { where: { id: id} }
        );

        console.log(`Review with ID: ${id} has been soft deleted (isBlocked set to true).`);

        // Step 3: Publish a message to RabbitMQ for logging or additional downstream processing
        const message = { reviewId: id, isBlocked: true };
        await publishToQueue("delete-review-service", message); // Queue name for delete messages

        console.log(`Message sent to delete-review-service queue for review ID: ${id}`);
        return { message: `Soft delete process completed for review ID: ${id}` };
    } catch (error) {
        console.error("Error during review soft delete process:", error);
        throw error;
    }
}







export default router;
