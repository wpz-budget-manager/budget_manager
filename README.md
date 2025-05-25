# Budget Manager

A web application for managing personal budget with Django backend and React frontend.

## Local Development Setup

### Prerequisites

- [Git](https://git-scm.com/)
- [pyenv](https://github.com/pyenv/pyenv) for Python version management
- [nvm](https://github.com/nvm-sh/nvm) for Node.js version management

### Python Environment Setup

1. Install pyenv:
   - **macOS** (using Homebrew):
     ```bash
     brew install pyenv
     ```
   - **Windows** (using pyenv-win):
     ```bash
     pip install pyenv-win
     ```
   - For detailed installation instructions, visit the [pyenv GitHub repository](https://github.com/pyenv/pyenv#installation)

2. Install the required Python version:
   ```bash
   pyenv install
   ```

3. Navigate to the backend directory and install Python dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. Setup pre-commit hooks (optional, from project root):
   ```bash
   pip install -r requirements.txt  # main requirements.txt for dev tools
   pre-commit install
   ```

### Node.js Environment Setup

1. Install nvm:
   - **macOS/Linux**:
     ```bash
     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
     ```
   - **Windows** (using nvm-windows):
     Download and install from [nvm-windows releases](https://github.com/coreybutler/nvm-windows/releases)

2. Install and use the required Node.js version:
   ```bash
   nvm install
   nvm use
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Apply database migrations:
   ```bash
   python manage.py migrate
   ```

3. (Optional) Create a Django superuser:
   ```bash
   python manage.py createsuperuser
   ```

4. Start the Django development server:
   ```bash
   python manage.py runserver
   ```
   The backend will be available at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install JavaScript dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```
   The frontend will be available at http://localhost:3000

## Docker Setup (Alternative)

If you prefer using Docker instead of setting up the environment locally:

1. Make sure [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/) are installed

2. Build and start all services:
   ```bash
   docker-compose up --build
   ```

3. Access the applications:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

4. (Optional) Create a Django superuser inside the container:
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

> Note: The application uses SQLite for local and containerized environments by default.

## Project Structure

- `backend/`: Django application
  - `budget_manager/`: Project configuration
  - `users/`: Django app for user management
- `frontend/`: React application
- `requirements.txt`: development tools (e.g. pre-commit)
- `backend/requirements.txt`: Django + API dependencies
