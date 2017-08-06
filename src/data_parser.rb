require 'CSV'

keys = ["FID","vtj_prt","tyyppi_koodi","tyyppi","tila_koodi","tila","ratu_vastaavuus_koodi","ratu_vastaavuus","ratu_laatu_koodi","ratu_laatu","ratu","muokkauspvm","luontipvm","kuntarekisteri_id","kg_krakenn","jarjnro","id","i_raktilav","i_pyraknro","i_nkoord","i_kokala","i_kerrosala","i_kerrlkm","i_kellarala","i_huoneistojen_lkm","i_ekoord","datanomistaja","d_ashuoala","c_vtj_prt","c_viemlii","c_vesilii","c_valmpvm","c_sahkolii","c_rakeaine","c_poltaine","c_lammtapa","c_kiinteistotunnus","c_kayttark","c_julkisivu","c_hissi","geom"]

data_file = '../rakennukset_kartalla.csv'
data = []
CSV.foreach(data_file, headers: true) do |row|
  data << row.to_hash
end