
export class JsonValidatorInterface {

    async validateRoomData(input_string) {
        const result = await fetch(`/jsonvalidators/room`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ input_string })
        });

        return result.json();
    }
}
