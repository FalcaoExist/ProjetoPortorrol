FROM python:3.11-slim
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir ruff
WORKDIR /src
ENTRYPOINT ["ruff"]
