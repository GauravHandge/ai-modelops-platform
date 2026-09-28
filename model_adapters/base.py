from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple, Union

class ModelAdapter(ABC):
    """
    Generic standard model contract for the AI ModelOps Platform.
    Enables the platform to load models, validate input payloads, execute predictions,
    and inspect metadata regardless of the underlying ML framework.
    """

    def __init__(self, artifact_path: str, input_schema: Optional[Dict[str, Any]] = None, output_schema: Optional[Dict[str, Any]] = None):
        self.artifact_path = artifact_path
        self.input_schema = input_schema or {}
        self.output_schema = output_schema or {}
        self.model = None
        self.loaded = False

    @abstractmethod
    def load(self) -> bool:
        """
        Load model artifact into memory.
        Returns True if load is successful.
        """
        pass

    @abstractmethod
    def validate_input(self, input_data: Any) -> Tuple[bool, Optional[str]]:
        """
        Validate incoming prediction payload against registered input schema.
        Returns (is_valid, error_message).
        """
        pass

    @abstractmethod
    def predict(self, input_data: Any) -> Dict[str, Any]:
        """
        Execute prediction on input data payload.
        Returns a dictionary containing:
        - "prediction": Any (list/int/float/dict)
        - "probabilities": Optional[List/Dict]
        """
        pass

    def get_metadata(self) -> Dict[str, Any]:
        """
        Return metadata regarding adapter, artifact, and loaded state.
        """
        return {
            "adapter_type": self.__class__.__name__,
            "artifact_path": self.artifact_path,
            "loaded": self.loaded,
            "input_schema": self.input_schema,
            "output_schema": self.output_schema
        }
