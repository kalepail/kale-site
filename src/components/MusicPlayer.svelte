<script lang="ts">
  import Card from './ui/Card.svelte';
</script>

<Card className="p-6">
  <h3 class="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
    🎵 Farm Music
  </h3>
  
  <div class="space-y-4">
    <p class="text-sm text-gray-600">
      Play (then mute if you want) to help keep this tab active
    </p>
    
    <audio class="w-full" controls loop>
      <source type="audio/mpeg" src="kale-farmer-song.mp3" />
      Your browser does not support the audio element.
    </audio>
  </div>
</Card>
