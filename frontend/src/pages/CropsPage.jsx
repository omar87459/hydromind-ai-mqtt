import { useApp } from "../context/AppContext";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";
import CropCard from "../components/crops/CropCard";
import CropDetail from "../components/crops/CropDetail";

export default function CropsPage() {
  const { crops, loading, loadError, selectedCrop, selectedCropId, setSelectedCropId } = useApp();

  if (loading) return <LoadingBlock label="Loading crop database..." />;
  if (loadError) return <ErrorBlock message={loadError} />;

  return (
    <div>
      <p className="section-sub">
        {crops.length} hydroponic crops available. Select a crop to see its full requirement
        profile.
      </p>

      <div className="grid grid-cols-3">
        {crops.map((crop) => (
          <CropCard
            key={crop.id}
            crop={crop}
            active={crop.id === selectedCropId}
            onClick={() => setSelectedCropId(crop.id)}
          />
        ))}
      </div>

      {selectedCrop && (
        <div className="mt-24">
          <CropDetail crop={selectedCrop} />
        </div>
      )}
    </div>
  );
}
