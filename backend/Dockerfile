# Use Maven with OpenJDK 17 as the base image
FROM maven:3.9.4-openjdk-17

# Set the working directory
WORKDIR /app

# Copy pom.xml first for better caching
COPY pom.xml .

# Copy the source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Expose the port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "target/ledger-1.0.0.jar", "--spring.profiles.active=railway"]