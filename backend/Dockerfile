# ================= BUILD STAGE =================
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml first for better caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests -B

# ================= RUNTIME STAGE =================
FROM eclipse-temurin:17-jre

WORKDIR /app

# Create a non-root user
RUN addgroup --system spring && adduser --system spring --ingroup spring

# Copy the built JAR file
COPY --from=build /app/target/*.jar app.jar

# Change ownership to the non-root user
RUN chown spring:spring app.jar

# Switch to the non-root user
USER spring

# Expose the port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
