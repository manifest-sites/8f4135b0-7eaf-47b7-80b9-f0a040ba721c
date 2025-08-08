import { createEntityClient } from "../utils/entityWrapper";
import schema from "./Workout.json";
export const Workout = createEntityClient("Workout", schema);
