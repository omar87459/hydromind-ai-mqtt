from fastapi import APIRouter, HTTPException

from .. import data_store

router = APIRouter(prefix="/methods", tags=["Methods"])


@router.get("")
def list_methods():
    return data_store.get_methods()


@router.get("/{method_id}")
def get_method(method_id: str):
    method = data_store.get_method_by_id(method_id)
    if not method:
        raise HTTPException(status_code=404, detail=f"Method '{method_id}' not found")
    return method


@router.get("/{method_id}/crops")
def get_method_crops(method_id: str):
    method = data_store.get_method_by_id(method_id)
    if not method:
        raise HTTPException(status_code=404, detail=f"Method '{method_id}' not found")
    return data_store.get_crops_for_method(method_id)
