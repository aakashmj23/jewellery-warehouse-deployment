FROM eclipse-temurin:21-jre

WORKDIR /app

RUN useradd -m appuser

COPY --chown=appuser:appuser target/ecom-backend.jar app.jar

USER appuser

EXPOSE 8085

CMD ["java","-jar","app.jar"]