from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class TargetRange:
    min: int
    max: int


@dataclass(frozen=True)
class GoalTargets:
    calories: TargetRange
    protein_g: TargetRange
    carbs_g: TargetRange
    fat_g: TargetRange

    def to_dict(self) -> Dict[str, Dict[str, int]]:
        return {
            "calories": {"min": self.calories.min, "max": self.calories.max},
            "protein_g": {"min": self.protein_g.min, "max": self.protein_g.max},
            "carbs_g": {"min": self.carbs_g.min, "max": self.carbs_g.max},
            "fat_g": {"min": self.fat_g.min, "max": self.fat_g.max},
        }


def build_prompt(goal_text: str) -> str:
    return (
        "You are a nutrition assistant. Given a user's goal, output suggested target ranges for "
        "daily calories, protein (g), carbs (g), and fat (g) as min/max integers in JSON. "
        "Favor higher protein for muscle gain and lower calories for fat loss. "
        f"User goal: {goal_text!r}"
    )


def _mock_gpt_response(goal_text: str) -> GoalTargets:
    normalized = goal_text.lower()
    if any(keyword in normalized for keyword in ["build muscle", "muscle", "strength", "bulk"]):
        return GoalTargets(
            calories=TargetRange(2600, 3200),
            protein_g=TargetRange(150, 220),
            carbs_g=TargetRange(280, 380),
            fat_g=TargetRange(70, 95),
        )
    if any(keyword in normalized for keyword in ["lose weight", "fat loss", "cut", "lean"]):
        return GoalTargets(
            calories=TargetRange(1600, 2100),
            protein_g=TargetRange(120, 170),
            carbs_g=TargetRange(120, 180),
            fat_g=TargetRange(45, 65),
        )
    if any(keyword in normalized for keyword in ["endurance", "marathon", "cardio"]):
        return GoalTargets(
            calories=TargetRange(2200, 2800),
            protein_g=TargetRange(110, 150),
            carbs_g=TargetRange(260, 360),
            fat_g=TargetRange(55, 75),
        )
    return GoalTargets(
        calories=TargetRange(2000, 2500),
        protein_g=TargetRange(100, 140),
        carbs_g=TargetRange(200, 280),
        fat_g=TargetRange(55, 75),
    )


def derive_targets(goal_text: str) -> Dict[str, Dict[str, int]]:
    prompt = build_prompt(goal_text)
    _ = prompt
    targets = _mock_gpt_response(goal_text)
    return targets.to_dict()
