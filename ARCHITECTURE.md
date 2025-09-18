
# Architecture Decision Record: Internal Hosting for RMN Analyst

## Status

Proposed

## Context

The business needs to share the RMN Analyst tool internally with team members for collaboration and analysis. The key constraints are:
- The solution should be hosted internally or on Petco-approved systems.
- Uploaded files (PDFs) must not be stored long-term to protect sensitive data.
- The architecture should be simple to deploy and maintain.

## Decision Drivers

- **Security and Data Privacy**: Avoiding long-term storage of uploaded documents is a primary concern.
- **Ease of Deployment**: The solution should be easy for team members to access without complex setup.
- **Scalability**: The architecture should be able to handle a small team of users, with potential for growth.
- **Existing Infrastructure**: Leveraging existing Petco systems like Snowflake or other internal tools is preferred.

## Considered Options

### 1. Local-First Hosting with `npm run dev`

- **Architecture**: Each team member clones the Git repository and runs the application on their local machine using the `npm run dev` command. File processing happens in the browser, and communication with the Gemini API is done directly from the client-side.
- **File Handling**: Files are loaded into the browser's memory and are not stored on any server. Data is cleared on page refresh.
- **Pros**:
    - Simple to set up (requires Node.js and Git).
    - High data privacy as files never leave the user's machine.
    - No additional hosting costs.
- **Cons**:
    - Requires each user to have a technical setup (Node.js, dependencies).
    - No central point of access; version consistency depends on Git workflow.
    - Not suitable for non-technical users.

### 2. Internal Static Web Server

- **Architecture**: The React application is built into static HTML, CSS, and JavaScript files using `npm run build`. These files are then hosted on a simple internal web server (e.g., Nginx, Apache, or a Node.js-based server).
- **File Handling**: Similar to local hosting, files are processed in the browser. No server-side storage.
- **Pros**:
    - Centralized access via a URL.
    - No client-side setup needed for users (just a web browser).
    - Improves version consistency.
- **Cons**:
    - Requires setting up and maintaining an internal web server.
    - An additional step to deploy updates (build and copy files).

### 3. Containerization with Docker

- **Architecture**: The application is containerized using Docker, encapsulating the Node.js environment and the application code. The container can be run on any machine with Docker installed.
- **File Handling**: Files are processed within the container's memory and discarded after the session.
- **Pros**:
    - Consistent environment for all users.
    - Simplifies dependency management.
    - Can be deployed on internal container orchestration platforms.
- **Cons**:
    - Higher initial setup complexity (writing Dockerfiles).
    - Users need Docker installed on their machines if running locally.

### 4. Snowflake Streamlit Integration

- **Architecture**: This option involves re-architecting the application to use Python and Streamlit. The frontend would be rebuilt using Streamlit components, and the analysis logic would be in Python. The application would be deployed within the Snowflake Streamlit environment.
- **File Handling**: Streamlit's `st.file_uploader` handles file uploads, and the data is processed in-memory during the session. The data is not stored in Snowflake tables unless explicitly coded to do so.
- **Pros**:
    - Leverages existing Petco infrastructure.
    - Managed environment (deployment, security).
    - Easy to share with team members who have Snowflake access.
- **Cons**:
    - Requires a complete rewrite of the application from React/TypeScript to Python/Streamlit.
    - May have limitations on custom UI/UX compared to a React application.

## Decision

For the initial phase, **Option 2 (Internal Static Web Server)** is recommended. This approach provides a good balance between ease of access for non-technical users and security. It avoids the need for each user to set up a development environment while ensuring that uploaded files are not stored long-term.

As the project matures, **Option 3 (Containerization with Docker)** can be considered for more robust dependency management and deployment. **Option 4 (Snowflake Streamlit)** is a viable long-term strategy if the application needs deeper integration with data stored in Snowflake, but the rewrite effort is significant.

## Next Steps

1.  Identify a suitable internal machine or VM to host the static web server.
2.  Develop a simple deployment script to run `npm run build` and copy the `dist` folder to the web server's root directory.
3.  Create a simple Node.js Express server to serve the static files, ensuring it is configured for internal access only.
