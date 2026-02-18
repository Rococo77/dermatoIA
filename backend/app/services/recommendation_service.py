RECOMMENDATIONS = {
    "melanoma": {
        "critical": "URGENT: Suspicion de melanome de stade avance. Consultez immediatement un dermatologue ou rendez-vous aux urgences.",
        "high": "Suspicion de melanome. Prenez rendez-vous en urgence avec un dermatologue dans les 48h.",
        "medium": "Lesion necessitant une evaluation dermatologique. Consultez un dermatologue dans les 2 semaines.",
        "low": "Lesion d'apparence benigne mais une consultation preventive est recommandee.",
    },
    "eczema": {
        "critical": "Eczema severe avec risque d'infection. Consultez un medecin rapidement.",
        "high": "Eczema important necessitant un traitement medical. Prenez rendez-vous avec votre medecin.",
        "medium": "Eczema modere. Un traitement topique pourrait etre necessaire. Consultez si persistance.",
        "low": "Eczema leger. Hydratez regulierement la zone. Consultez si aggravation.",
    },
    "psoriasis": {
        "critical": "Psoriasis severe et etendu. Une consultation dermatologique urgente est necessaire.",
        "high": "Psoriasis important. Prenez rendez-vous avec un dermatologue pour un traitement adapte.",
        "medium": "Psoriasis modere. Une consultation permettrait d'adapter le traitement.",
        "low": "Psoriasis leger. Continuez les soins hydratants. Surveillez l'evolution.",
    },
    "default": {
        "critical": "Lesion cutanee necessitant une attention medicale urgente. Rendez-vous aux urgences ou consultez un dermatologue immediatement.",
        "high": "Lesion cutanee necessitant une evaluation medicale. Prenez rendez-vous rapidement avec un dermatologue.",
        "medium": "Lesion cutanee a surveiller. Une consultation dermatologique est recommandee.",
        "low": "Lesion d'apparence benigne. Surveillez l'evolution et consultez si changement.",
    },
}

HOSPITAL_SEVERITY_THRESHOLD = {"high", "critical"}


class RecommendationService:
    def generate(self, lesion_type: str, severity_level: str) -> dict:
        type_recs = RECOMMENDATIONS.get(lesion_type, RECOMMENDATIONS["default"])
        recommendation = type_recs.get(severity_level, type_recs["low"])
        requires_hospital = severity_level in HOSPITAL_SEVERITY_THRESHOLD

        return {
            "recommendation": recommendation,
            "requires_hospital": requires_hospital,
        }
