from fastapi import APIRouter, HTTPException

from .. import data_store

router = APIRouter(prefix="/crops", tags=["Crops"])


@router.get("")
def list_crops():
    return data_store.get_crops()


@router.get("/{crop_id}")
def get_crop(crop_id: str):
    crop = data_store.get_crop_by_id(crop_id)
    if not crop:
        raise HTTPException(status_code=404, detail=f"Crop '{crop_id}' not found")
    return crop


@router.get("/{crop_id}/methods")
def get_crop_methods(crop_id: str):
    crop = data_store.get_crop_by_id(crop_id)
    if not crop:
        raise HTTPException(status_code=404, detail=f"Crop '{crop_id}' not found")
    return data_store.get_methods_for_crop(crop_id)
