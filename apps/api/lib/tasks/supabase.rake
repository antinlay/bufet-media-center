namespace :supabase do
  desc "Sync legacy Rails organizations, screens, media and playlists to Supabase"
  task sync: :environment do
    result = Supabase::Sync::All.call!
    puts "Synced organizations=#{result[:organizations]} screens=#{result[:screens]} media=#{result[:media]}"
  end

  desc "Mark Supabase screens without a recent heartbeat as offline"
  task mark_stale: :environment do
    puts "Marked offline=#{Supabase::ScreenStatus.mark_stale!}"
  end
end
