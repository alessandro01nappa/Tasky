FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
COPY backend/pom.xml backend/pom.xml
RUN mvn -f backend/pom.xml dependency:go-offline -B
COPY backend/src backend/src
RUN mvn -f backend/pom.xml package -DskipTests -B

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/backend/target/tasky-backend-0.0.1-SNAPSHOT.jar app.jar
ENV JAVA_OPTS="-Xms128m -Xmx384m"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
