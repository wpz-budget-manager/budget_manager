# Use official Python image
FROM python:3.13

# Set the working directory in the container
WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application files
COPY . .

# Ensure logs are output directly to the terminal
ENV PYTHONUNBUFFERED=1

# Make the entrypoint script executable
RUN chmod +x entrypoint.sh

# Expose port 8000 for Django
EXPOSE 8000

# Run the Django application
CMD ["./entrypoint.sh"]
