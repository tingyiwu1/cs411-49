import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Message.css"; // Import CSS file for styling
import { useLogin } from "../../hooks";


function MessagePage() {
    const [message, setMessage] = useState("");
    const [generatedMessage, setGeneratedMessage] = useState("");


    useEffect(() => {
        // Make a request to fetch the message when the component mounts
        axios.get("/evaluate")
            .then(response => {
                setMessage(response.data.response);
                setGeneratedMessage(response.data.generatedMessage);
            })
            .catch(error => {
                console.error("Error fetching message:", error);
                // Handle error
            });
    }, []);

    return (
        <div>
            <h1>Message Page</h1>
            <p>Generated Message: {generatedMessage}</p>
            <p>Response: {message}</p>
        </div>
    );
    
}

export default MessagePage;
