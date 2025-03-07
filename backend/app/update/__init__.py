from fastapi import APIRouter, HTTPException
from .docker_version_checker import DockerVersionChecker

router = APIRouter()
version_checker = DockerVersionChecker()

@router.get("/api/version-check")
async def check_version():
    try:
        result = await version_checker.check_version()
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))