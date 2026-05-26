# Stage 1: Build the application
FROM maven:3.9.8-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml and download dependencies first for better caching
COPY pom.xml ./
RUN mvn dependency:go-offline -B

# Copy the source code
COPY src ./src

# Build the application package
RUN mvn clean package -DskipTests

# Stage 2: Lightweight JRE Alpine runtime environment
FROM eclipse-temurin:17-jre-alpine AS run

WORKDIR /app

# Copy only the compiled executable jar from the build stage
COPY --from=build /app/target/*.jar ./app.jar

# Spring Boot application server port
EXPOSE 8086

ENTRYPOINT ["java", "-jar", "app.jar"]
