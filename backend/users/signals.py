from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, Category


@receiver(post_save, sender=CustomUser)
def create_default_categories(sender, instance, created, **kwargs):
    if created:
        default_names = ["Food", "Transport", "Salary"]
        for name in default_names:
            Category.objects.create(name=name, user=instance)
