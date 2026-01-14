/**
 * Provides a simple interface for validating room JSON data
 * by delegating the validation to a backend service.
 *
 * This class does not perform validation itself — it simply
 * sends the raw input string to the server and returns the
 * server’s validation response.
 */
export class JsonValidatorInterface {

    /**
     * Sends room JSON text to the backend validator.
     * The server is expected to return:
     *   - success/failure status
     *   - error messages or parsed data
     *
     * @param {string} input_string - Raw JSON text from the editor.
     * @returns {Promise<Object>} - Parsed JSON response from the server.
     */
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
